import React from 'react';
import { CheckCircle, AlertTriangle, XCircle, ArrowRight } from 'lucide-react';

interface PrescreenResultProps {
  result: 'pass' | 'caution' | 'fail';
  onContinue: () => void;
  onBack: () => void;
}

const PrescreenResult: React.FC<PrescreenResultProps> = ({ result, onContinue, onBack }) => {
  const getResultConfig = () => {
    switch (result) {
      case 'pass':
        return {
          icon: CheckCircle,
          title: 'Congratulations! You Passed the Prescreen',
          subtitle: 'You meet our requirements and can proceed to the next phase.',
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          buttonColor: 'bg-green-600 hover:bg-green-700',
          nextStep: 'Continue to Onboarding'
        };
      case 'caution':
        return {
          icon: AlertTriangle,
          title: 'Prescreen Results: Caution',
          subtitle: 'You meet most requirements but some areas need attention during onboarding.',
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          buttonColor: 'bg-yellow-600 hover:bg-yellow-700',
          nextStep: 'Continue to Onboarding'
        };
      case 'fail':
        return {
          icon: XCircle,
          title: 'Prescreen Results: Not Eligible',
          subtitle: 'Unfortunately, you do not meet our current requirements for this position.',
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          buttonColor: 'bg-red-600 hover:bg-red-700',
          nextStep: 'Back to Dashboard'
        };
    }
  };

  const config = getResultConfig();
  const IconComponent = config.icon;

  const getRecommendations = () => {
    switch (result) {
      case 'pass':
        return [
          'Complete the detailed onboarding process',
          'Upload required documents',
          'Provide professional references',
          'Complete background verification'
        ];
      case 'caution':
        return [
          'Focus on areas that need improvement during onboarding',
          'Consider additional certifications if applicable',
          'Be prepared to discuss experience gaps',
          'Complete all required documentation thoroughly'
        ];
      case 'fail':
        return [
          'Consider gaining more experience in the field',
          'Look into relevant certifications',
          'Check other positions that might be a better fit',
          'Reapply when you meet the requirements'
        ];
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Result Card */}
        <div className={`bg-white rounded-lg shadow-sm border ${config.borderColor} p-8 mb-8`}>
          <div className="text-center">
            <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full ${config.bgColor} mb-6`}>
              <IconComponent className={`w-8 h-8 ${config.color}`} />
            </div>
            
            <h1 className={`text-2xl font-bold ${config.color} mb-2`}>
              {config.title}
            </h1>
            
            <p className="text-gray-600 mb-8">
              {config.subtitle}
            </p>

            {/* Score Display */}
            <div className="bg-gray-50 rounded-lg p-6 mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Assessment Score</h3>
              <div className="flex items-center justify-center space-x-4">
                <div className="text-center">
                  <div className={`text-3xl font-bold ${config.color}`}>
                    {result === 'pass' ? '85%' : result === 'caution' ? '70%' : '45%'}
                  </div>
                  <div className="text-sm text-gray-500">Overall Score</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-900">
                    {result === 'pass' ? 'A' : result === 'caution' ? 'B' : 'C'}
                  </div>
                  <div className="text-sm text-gray-500">Grade</div>
                </div>
              </div>
            </div>

            {/* Recommendations */}
            <div className="text-left">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Next Steps</h3>
              <ul className="space-y-3">
                {getRecommendations().map((recommendation, index) => (
                  <li key={index} className="flex items-start">
                    <div className={`w-2 h-2 rounded-full ${config.color} mt-2 mr-3 flex-shrink-0`}></div>
                    <span className="text-gray-700">{recommendation}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between">
          <button
            onClick={onBack}
            className="px-6 py-3 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
          >
            Back to Dashboard
          </button>
          
          {result !== 'fail' && (
            <button
              onClick={onContinue}
              className={`px-6 py-3 text-white rounded-md transition-colors flex items-center space-x-2 ${config.buttonColor}`}
            >
              <span>{config.nextStep}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Additional Information */}
        {result === 'fail' && (
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">
              Need Help?
            </h3>
            <p className="text-blue-800 mb-4">
              If you believe there was an error in the assessment or have questions about the requirements, 
              please contact our support team.
            </p>
            <div className="flex items-center space-x-4 text-sm text-blue-700">
              <span>📧 support@noblecare.com</span>
              <span>📞 +91 844 763 9569</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PrescreenResult;
