import React from 'react';
import ExtractionContainer from './extraction/ExtractionContainer';

interface ExtractedTextTabProps {
  onEvaluationComplete?: () => Promise<void>;
}

const ExtractedTextTab: React.FC<ExtractedTextTabProps> = ({ onEvaluationComplete }) => {
  return (
    <ExtractionContainer onEvaluationComplete={onEvaluationComplete} />
  );
};

export default ExtractedTextTab;
