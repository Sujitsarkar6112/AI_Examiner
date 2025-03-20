import os
import json
import re
import logging
import time
import markdown
import tempfile

# Fix the imports for the prompts module
try:
    from prompts import EVALUATION_PROMPT, get_professors
except ImportError:
    try:
        from .prompts import EVALUATION_PROMPT, get_professors
    except ImportError:
        EVALUATION_PROMPT = "Evaluate the student's answers to the following questions."
        def get_professors(question_paper_text=None):
            return [
                {
                    "name": "TechnicalProfessor",
                    "system_message": "You are a professor who evaluates technical accuracy of student answers."
                },
                {
                    "name": "CommunicationProfessor",
                    "system_message": "You are a professor who evaluates clarity and communication quality of student answers."
                }
            ]

from dotenv import load_dotenv
import google.generativeai as genai

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
debug_log_path = os.path.join(os.path.dirname(__file__), '..', 'debug.log')
file_handler = logging.FileHandler(debug_log_path, mode='w')
file_handler.setLevel(logging.DEBUG)
formatter = logging.Formatter('%(asctime)s - %(levelname)s - %(message)s')
file_handler.setFormatter(formatter)
logging.getLogger().addHandler(file_handler)

# Load environment variables
load_dotenv()

# Configure Gemini API
api_key = os.getenv("GEMINI_API_KEY")
if not api_key:
    raise Exception("GEMINI_API_KEY not found in environment variables")
genai.configure(api_key=api_key)

def evaluate_answers(extracted_text, file_name, question_paper_text=None):

    logging.info(f"Starting evaluation for file: {file_name}")
    logging.debug(f"Answer text: {extracted_text}")
    logging.debug(f"Question paper text provided: {bool(question_paper_text)}")
    
    markdown_file_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), f"{file_name}_evaluation.md")
    os.makedirs(os.path.dirname(markdown_file_path), exist_ok=True)
    
    # Build question paper dictionary
    question_paper = {"questions": []}
    if question_paper_text:
        logging.info("Question paper text provided, extracting questions and marks")
        logging.debug(f"Question paper text: {question_paper_text}")
        pattern = r'(?:^|\n)(\d+)\.(?:\s*([a-z]\)))?\s*(.*?)\s*\[(\d+)\]'
        matches = re.findall(pattern, question_paper_text, re.MULTILINE | re.DOTALL)
        logging.info(f"Found {len(matches)} questions in question paper")
        for match in matches:
            if len(match) >= 4:
                q_num, letter, question_text, marks = match
                full_text = f"{letter} {question_text.strip()}" if letter else question_text.strip()
                question_paper["questions"].append({
                    "id": q_num,
                    "text": full_text,
                    "marks": int(marks)
                })
                logging.debug(f"Question {q_num}: {full_text} [{marks} marks]")
    if not question_paper["questions"]:
        logging.warning("No questions found in question paper, creating default question")
        question_paper["questions"] = [{
            "id": "1",
            "text": "Evaluate the following answer",
            "marks": 10
        }]
    
    # Map questions with answers
    qa_mapping = match_questions_with_answers(question_paper, extracted_text)
    if not qa_mapping:
        logging.error("Failed to match questions with answers")
        with open(markdown_file_path, 'w', encoding='utf-8') as f:
            f.write("# Error in Evaluation\n\n")
            f.write("No questions could be matched with answers. Please check the format of your question paper and answer sheet.")
        raise Exception("Failed to evaluate - could not match questions with answers")
    
    # Evaluate using the multi-agent system (fallback mode removed)
    evaluation_output = multi_agent_evaluate_answers(qa_mapping, question_paper_text)
    with open(markdown_file_path, 'w', encoding='utf-8') as f:
        f.write(evaluation_output)
    
    return {"success": True, "evaluation_path": markdown_file_path}

def get_gemini_model():

    gemini_api_key = os.getenv("GEMINI_API_KEY")
    if not gemini_api_key:
        raise Exception("GEMINI_API_KEY not found in environment variables")
    
    # Use the specified Gemini model
    model = genai.GenerativeModel('gemini-2.0-flash-thinking-exp-01-21')
    logging.info("Gemini model initialized successfully")
    return model

def multi_agent_evaluate_answers(qa_mapping, question_paper_text=None):

    logging.info("Starting multi-agent evaluation of answers")
    
    # Get the model
    try:
        model = get_gemini_model()
    except Exception as e:
        logging.error(f"Error initializing Gemini model: {e}")
        raise Exception(f"Error initializing Gemini model: {e}")
    
    # Initialize professor personas from prompts
    professors = get_professors(question_paper_text)
    
    # Create an evaluation report
    markdown_report = "# Student Answer Evaluation\n\n"
    total_marks = 0
    max_total_marks = 0
    
    for item in qa_mapping:
        question_num = item['questionNumber']
        question_text = item['questionText']
        max_marks = item['maxMarks']
        max_total_marks += max_marks
        answer = item['answer']
        
        logging.info(f"Evaluating question {question_num}")
        
        # Step 1: Individual Evaluations
        evaluations = {}
        
        for evaluator_key in ["Theoretical_Evaluator", "Practical_Evaluator", "Holistic_Evaluator"]:
            evaluator = professors[evaluator_key]
            
            # Create evaluation prompt for each persona
            eval_prompt = f"""
            You are {evaluator['name']}, evaluating a student's answer on Object-Oriented Programming.
            
            QUESTION {question_num} [{max_marks} marks]:
            {question_text}
            
            STUDENT'S ANSWER:
            {answer}
            
            EVALUATION INSTRUCTIONS:
            1. Identify the key points required by the question from your evaluator perspective.
            2. List which of these points are addressed in the student's answer.
            3. Provide your evaluation with a proposed grade (out of {max_marks}) and clear rationale.
            
            Format your response as:
            
            ## {evaluator['name']} Evaluation
            
            **Key Points Required:**
            - [list key points]
            
            **Points Addressed:**
            - [list addressed points]
            
            **Evaluation:**
            [your evaluation with rationale]
            
            **Proposed Grade:** [X] out of {max_marks}
            """
            
            try:
                response = model.generate_content(eval_prompt)
                if hasattr(response, 'text'):
                    evaluations[evaluator_key] = response.text
                    logging.info(f"Completed {evaluator_key} evaluation for question {question_num}")
                else:
                    evaluations[evaluator_key] = f"## {evaluator['name']} Evaluation\n\n**Error:** Unable to generate evaluation.\n\n**Proposed Grade:** 0 out of {max_marks}"
                    logging.error(f"Empty response from Gemini for {evaluator_key} evaluation")
                
                # Add a 5-second sleep to prevent resource exhaustion
                time.sleep(2)
                
            except Exception as e:
                evaluations[evaluator_key] = f"## {evaluator['name']} Evaluation\n\n**Error:** {str(e)}\n\n**Proposed Grade:** 0 out of {max_marks}"
                logging.error(f"Error in {evaluator_key} evaluation: {e}")
        
        # Step 2 & 3: Group Discussion and Consensus
        consensus_evaluator = professors["Consensus_Evaluator"]
        
        # Extract scores from each evaluator for inclusion in the final output
        theoretical_score = "N/A"
        practical_score = "N/A"
        holistic_score = "N/A"
        
        try:
            theoretical_score_match = re.search(r"\*\*Proposed Grade:\*\* (\d+(?:\.\d+)?)", evaluations["Theoretical_Evaluator"])
            if theoretical_score_match:
                theoretical_score = theoretical_score_match.group(1)
        except:
            pass
            
        try:
            practical_score_match = re.search(r"\*\*Proposed Grade:\*\* (\d+(?:\.\d+)?)", evaluations["Practical_Evaluator"])
            if practical_score_match:
                practical_score = practical_score_match.group(1)
        except:
            pass
            
        try:
            holistic_score_match = re.search(r"\*\*Proposed Grade:\*\* (\d+(?:\.\d+)?)", evaluations["Holistic_Evaluator"])
            if holistic_score_match:
                holistic_score = holistic_score_match.group(1)
        except:
            pass
        
        consensus_prompt = f"""
        You are {consensus_evaluator['name']}, facilitating a final consensus evaluation.
        
        QUESTION {question_num} [{max_marks} marks]:
        {question_text}
        
        STUDENT'S ANSWER:
        {answer}
        
        EVALUATIONS FROM DIFFERENT PERSPECTIVES:
        
        {evaluations["Theoretical_Evaluator"]}
        
        {evaluations["Practical_Evaluator"]}
        
        {evaluations["Holistic_Evaluator"]}
        
        CONSENSUS INSTRUCTIONS:
        1. Review all three evaluations
        2. Identify areas of agreement and disagreement
        3. Determine a final consensus grade and justification
        
        Format your response as:
        
        ## Question {question_num}: {question_text}
        
        **Score:** [X] out of {max_marks}
        
        **Individual Scores:**
        - Theoretical Perspective: {theoretical_score} out of {max_marks}
        - Practical Perspective: {practical_score} out of {max_marks}
        - Holistic Perspective: {holistic_score} out of {max_marks}
        
        **Consensus Feedback:**
        [concise feedback addressing main points]
        
        **Strengths:**
        - [bullet point strengths]
        
        **Areas for Improvement:**
        - [bullet point areas for improvement]
        """
        
        try:
            consensus_response = model.generate_content(consensus_prompt)
            if hasattr(consensus_response, 'text'):
                consensus_text = consensus_response.text
                markdown_report += consensus_text + "\n\n"
                
                # Try to extract the score
                try:
                    score_line = [line for line in consensus_text.split('\n') if '**Score:**' in line][0]
                    score_str = score_line.split('**Score:**')[1].strip().split(' ')[0]
                    score = float(score_str)
                    total_marks += score
                    logging.info(f"Score for question {question_num}: {score} out of {max_marks}")
                except Exception as e:
                    logging.warning(f"Could not extract score for question {question_num}: {e}")
            else:
                markdown_report += f"## Question {question_num}\n\n"
                markdown_report += f"**Score:** 0 out of {max_marks}\n\n"
                markdown_report += "**Feedback:**\nUnable to generate consensus evaluation.\n\n"
                logging.error(f"Empty consensus response for question {question_num}")
        except Exception as e:
            markdown_report += f"## Question {question_num}\n\n"
            markdown_report += f"**Score:** 0 out of {max_marks}\n\n"
            markdown_report += f"**Feedback:**\nError in consensus evaluation: {str(e)}\n\n"
            logging.error(f"Error in consensus evaluation for question {question_num}: {e}")
    
    # Add a summary section with total marks
    markdown_report += "# Summary\n\n"
    markdown_report += f"**Total Score:** {total_marks} out of {max_total_marks} ({int((total_marks/max_total_marks)*100)}%)\n\n"
    markdown_report += "This evaluation was generated using a multi-agent system with theoretical, practical, and holistic perspectives, all represented by Professor Sharma.\n"
    
    logging.info("Evaluation completed successfully")
    return markdown_report

def match_questions_with_answers(question_paper, answer_text):

    result = []
    logging.debug(f"Question paper: {json.dumps(question_paper, indent=2)}")
    logging.debug(f"Original answer text: {answer_text}")
    
    answer_pattern = r'(?:^|\n)(?:\*\*)?Answer\s*(\d+)(?:[a-z]\))?:\*?\*?\s*(.*?)(?=(?:^|\n)(?:\*\*)?Answer\s*\d+(?:[a-z]\))?:|\Z)'
    answers = re.findall(answer_pattern, answer_text, re.DOTALL | re.MULTILINE)
    logging.debug(f"Standard answer pattern matches: {answers}")
    
    answer_dict = {}
    if answers:
        for num_str, text in answers:
            try:
                num = int(num_str)
                answer_dict[num] = text.strip()
                logging.debug(f"Matched answer for question {num}: '{text.strip()}'")
            except ValueError:
                logging.warning(f"Could not convert '{num_str}' to integer")
                continue
    else:
        logging.info("Standard answer pattern not found, trying alternative patterns")
        alt_pattern = r'(?:^|\n)(?:Answer\s*)?(\d+)\.?\s*([a-z]\))?\s*(.*?)(?=\n\d+\.|\n\d+[a-z]\)|\Z)'
        alt_answers = re.findall(alt_pattern, answer_text, re.DOTALL)
        logging.debug(f"Alternative pattern matches: {alt_answers}")
        for match in alt_answers:
            try:
                num_str = match[0]
                num = int(num_str)
                text = match[2] if len(match) > 2 else ""
                answer_dict[num] = text.strip()
                logging.debug(f"Matched alternative answer for question {num}: '{text.strip()}'")
            except (ValueError, IndexError) as e:
                logging.warning(f"Error processing alternative match {match}: {str(e)}")
                continue
        if not answer_dict and answer_text.strip():
            logging.info("No structured answers matched, using full text as answer for question 1")
            answer_dict[1] = answer_text.strip()
            logging.debug(f"Using full text as answer for question 1: '{answer_text.strip()}'")
    
    logging.debug(f"Final answer dictionary: {json.dumps(answer_dict, indent=2)}")
    
    for i, question in enumerate(question_paper['questions']):
        question_id = question.get('id', str(i+1))
        try:
            question_num = int(question_id)
            answer = answer_dict.get(question_num, "No answer provided")
            logging.debug(f"Mapping question ID {question_id} to answer: '{answer}'")
        except ValueError:
            question_num = i+1
            answer = answer_dict.get(question_num, "No answer provided")
            logging.debug(f"Mapping question index {i+1} to answer: '{answer}'")
            
        result.append({
            "questionNumber": question_id,
            "questionText": question['text'],
            "maxMarks": question['marks'],
            "answer": answer
        })
    
    logging.info(f"Question mapping results: {json.dumps(result, indent=2)}")
    return result

def evaluate_structured_answers(question_answers, file_name):
    """
    Evaluate structured question-answer mappings.
    
    Args:
        question_answers (list): List of dictionaries with 'question' and 'answer' keys
        file_name (str): Name of the file (for logging/reference)
        
    Returns:
        str or dict: Path to the evaluation markdown file or a dict with error info
    """
    try:
        logging.info(f"Evaluating structured answers for {file_name} with {len(question_answers)} QA pairs")
        
        # Format the QA pairs for the model - transform to the format expected by multi_agent_evaluate_answers
        qa_formatted = []
        for i, qa in enumerate(question_answers):
            if not qa.get('question') or not qa.get('answer'):
                continue
                
            # Extract marks if available in the question (e.g., [5 marks])
            marks = 5  # Default marks if not specified
            marks_match = re.search(r'\[(\d+)\s*(?:marks?|points?)\]', qa['question'], re.IGNORECASE)
            if marks_match:
                marks = int(marks_match.group(1))
            
            qa_formatted.append({
                'questionNumber': i + 1,  # 1-based question numbering
                'questionText': qa['question'].strip(),
                'answer': qa['answer'].strip(),
                'maxMarks': marks
            })
        
        if not qa_formatted:
            return {
                "success": False,
                "message": "No valid question-answer pairs found"
            }
        
        logging.info(f"Formatted {len(qa_formatted)} QA pairs for evaluation")
        
        # Use the multi-agent evaluation with the formatted QA pairs
        return multi_agent_evaluate_answers(qa_formatted)
        
    except Exception as e:
        logging.error(f"Error in evaluate_structured_answers: {str(e)}")
        import traceback
        logging.error(traceback.format_exc())
        return {
            "success": False,
            "message": f"Evaluation error: {str(e)}"
        }
