import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePolicy, useAcknowledgePolicy } from '@/hooks/useProgramsAndPolicies';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import {
  ArrowLeft, Shield, Clock, CheckCircle2, XCircle, AlertTriangle, Trophy,
} from 'lucide-react';
import { format } from 'date-fns';
import type { Json } from '@/integrations/supabase/types';

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correct_answer: number;
  explanation?: string;
}

const PolicyViewer = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [startTime] = useState(Date.now());
  const [step, setStep] = useState<'content' | 'quiz' | 'signature'>('content');
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});
  const [quizScore, setQuizScore] = useState<number | null>(null);
  const [quizAttempts, setQuizAttempts] = useState(0);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [signatureText, setSignatureText] = useState('');
  const contentRef = useRef<HTMLDivElement>(null);

  const { data: policy, isLoading } = usePolicy(id!);
  const acknowledgePolicy = useAcknowledgePolicy();

  const quizQuestions: QuizQuestion[] = policy?.quiz_questions
    ? (policy.quiz_questions as unknown as QuizQuestion[])
    : [];
  const hasQuiz = policy?.has_quiz && quizQuestions.length > 0;
  const passThreshold = policy?.pass_threshold || 80;

  useEffect(() => {
    const handleScroll = () => {
      if (!contentRef.current) return;
      const { scrollTop, scrollHeight, clientHeight } = contentRef.current;
      if (scrollTop + clientHeight >= scrollHeight - 50) {
        setHasScrolledToBottom(true);
      }
    };
    const content = contentRef.current;
    content?.addEventListener('scroll', handleScroll);
    return () => content?.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSubmitQuiz = () => {
    const total = quizQuestions.length;
    let correct = 0;
    quizQuestions.forEach((q) => {
      if (quizAnswers[q.id] === q.correct_answer) correct++;
    });
    const score = Math.round((correct / total) * 100);
    setQuizScore(score);
    setQuizAttempts(prev => prev + 1);

    if (score >= passThreshold) {
      setStep('signature');
    }
  };

  const handleRetryQuiz = () => {
    setQuizAnswers({});
    setQuizScore(null);
  };

  const handleAcknowledge = async () => {
    if (!signatureText.trim()) return;
    const timeSpent = Math.floor((Date.now() - startTime) / 1000);
    await acknowledgePolicy.mutateAsync({
      policyId: id!,
      signature: signatureText,
      quizScore: quizScore ?? undefined,
      quizAttempts,
      timeSpent,
    });
    navigate('/policies-page');
  };

  if (isLoading) {
    return <div className="text-center py-12 text-muted-foreground">Loading policy...</div>;
  }
  if (!policy) {
    return <div className="text-center py-12 text-muted-foreground">Policy not found</div>;
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      <Button variant="ghost" onClick={() => navigate('/policies-page')} className="mb-4">
        <ArrowLeft className="h-4 w-4 mr-2" /> Back to Library
      </Button>

      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="secondary"><Shield className="h-3 w-3 mr-1" /> Policy</Badge>
          <Badge variant="outline">{policy.policy_type}</Badge>
          {hasQuiz && <Badge variant="outline">Quiz Required</Badge>}
        </div>
        <h1 className="text-2xl font-display font-bold text-foreground">{policy.policy_name}</h1>
        {policy.effective_date && (
          <p className="text-sm text-muted-foreground">
            Effective {format(new Date(policy.effective_date), 'MMMM d, yyyy')}
            {' · '}Version {policy.version || 1}
          </p>
        )}
      </div>

      {/* Step: Content */}
      {step === 'content' && (
        <>
          <Card>
            <CardContent
              ref={contentRef}
              className="p-6 max-h-[600px] overflow-y-auto prose prose-sm max-w-none dark:prose-invert"
            >
              <div className="whitespace-pre-wrap text-foreground">{policy.policy_content}</div>
            </CardContent>
          </Card>

          <Button
            onClick={() => setStep(hasQuiz ? 'quiz' : 'signature')}
            disabled={!hasScrolledToBottom}
            className="w-full"
          >
            {hasScrolledToBottom
              ? (hasQuiz ? 'Continue to Quiz →' : 'Continue to Acknowledgment →')
              : 'Please scroll through the entire document'}
          </Button>
        </>
      )}

      {/* Step: Quiz */}
      {step === 'quiz' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-primary" />
              Compliance Quiz
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              You must score at least {passThreshold}% to acknowledge this policy.
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {quizScore !== null && quizScore < passThreshold && (
              <div className="p-4 rounded-lg border border-destructive/50 bg-destructive/5 flex items-center gap-3">
                <XCircle className="h-5 w-5 text-destructive shrink-0" />
                <div>
                  <p className="font-medium text-sm text-foreground">
                    Score: {quizScore}% — Below passing threshold of {passThreshold}%
                  </p>
                  <p className="text-xs text-muted-foreground">Please review the policy and try again.</p>
                </div>
              </div>
            )}

            {quizQuestions.map((q, idx) => (
              <div key={q.id} className="space-y-3">
                <p className="font-medium text-sm text-foreground">
                  {idx + 1}. {q.question}
                </p>
                <RadioGroup
                  value={quizAnswers[q.id]?.toString()}
                  onValueChange={(val) => setQuizAnswers(prev => ({ ...prev, [q.id]: parseInt(val) }))}
                >
                  {q.options.map((option, optIdx) => (
                    <div key={optIdx} className="flex items-center gap-2">
                      <RadioGroupItem value={optIdx.toString()} id={`${q.id}-${optIdx}`} />
                      <Label htmlFor={`${q.id}-${optIdx}`} className="text-sm cursor-pointer">
                        {option}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            ))}

            <div className="flex gap-3">
              {quizScore !== null && quizScore < passThreshold ? (
                <Button onClick={handleRetryQuiz} className="w-full">
                  Retry Quiz
                </Button>
              ) : (
                <Button
                  onClick={handleSubmitQuiz}
                  disabled={Object.keys(quizAnswers).length < quizQuestions.length}
                  className="w-full"
                >
                  Submit Quiz
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step: Signature */}
      {step === 'signature' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Acknowledgment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {quizScore !== null && quizScore >= passThreshold && (
              <div className="p-4 rounded-lg border border-primary/30 bg-primary/5 flex items-center gap-3">
                <Trophy className="h-5 w-5 text-primary shrink-0" />
                <p className="font-medium text-sm text-foreground">
                  Quiz passed with {quizScore}%! Please complete your acknowledgment below.
                </p>
              </div>
            )}

            <div className="flex items-start gap-3">
              <Checkbox
                id="agree-policy"
                checked={agreedToTerms}
                onCheckedChange={(checked) => setAgreedToTerms(checked === true)}
              />
              <label htmlFor="agree-policy" className="text-sm text-foreground leading-relaxed cursor-pointer">
                I have read and understand the above policy. I agree to comply with all requirements
                and guidelines outlined in this document.
              </label>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Electronic Signature <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                value={signatureText}
                onChange={(e) => setSignatureText(e.target.value)}
                placeholder="Type your full name as signature"
                className="w-full border rounded-md p-3 text-foreground bg-background font-cursive text-lg italic border-input"
                disabled={!agreedToTerms}
              />
            </div>

            <Button
              onClick={handleAcknowledge}
              disabled={!agreedToTerms || !signatureText.trim() || acknowledgePolicy.isPending}
              className="w-full"
            >
              {acknowledgePolicy.isPending ? (
                <><Clock className="h-4 w-4 mr-2 animate-spin" /> Processing...</>
              ) : (
                <><CheckCircle2 className="h-4 w-4 mr-2" /> Acknowledge Policy</>
              )}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PolicyViewer;
