import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProgram, useAcknowledgeProgram } from '@/hooks/useProgramsAndPolicies';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, FileText, Calendar, Clock, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';

const ProgramViewer = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [startTime] = useState(Date.now());
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [signatureText, setSignatureText] = useState('');

  const { data: program, isLoading } = useProgram(id!);
  const acknowledgeProgram = useAcknowledgeProgram();
  const contentRef = useRef<HTMLDivElement>(null);

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

  const handleAcknowledge = async () => {
    if (!signatureText.trim()) return;
    const timeSpent = Math.floor((Date.now() - startTime) / 1000);
    await acknowledgeProgram.mutateAsync({
      programId: id!,
      signature: signatureText,
      timeSpent,
    });
    navigate('/programs');
  };

  const canAcknowledge = hasScrolledToBottom && agreedToTerms && signatureText.trim().length > 0;

  if (isLoading) {
    return <div className="text-center py-12 text-muted-foreground">Loading program...</div>;
  }

  if (!program) {
    return <div className="text-center py-12 text-muted-foreground">Program not found</div>;
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      <Button variant="ghost" onClick={() => navigate('/programs')} className="mb-4">
        <ArrowLeft className="h-4 w-4 mr-2" /> Back to Library
      </Button>

      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge><FileText className="h-3 w-3 mr-1" /> Program</Badge>
          <Badge variant="outline">{program.program_type}</Badge>
          {program.is_featured && <Badge variant="secondary">Featured</Badge>}
        </div>
        <h1 className="text-2xl font-display font-bold text-foreground">{program.program_name}</h1>
        <p className="text-muted-foreground">{program.program_summary}</p>

        <div className="flex items-center gap-6 text-sm text-muted-foreground">
          {program.published_at && (
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              Effective {format(new Date(program.published_at), 'MMMM d, yyyy')}
            </span>
          )}
          <span className="flex items-center gap-1">
            Version {program.version || 1}
          </span>
        </div>
      </div>

      {/* Content */}
      <Card>
        <CardContent
          ref={contentRef}
          className="p-6 max-h-[600px] overflow-y-auto prose prose-sm max-w-none dark:prose-invert"
        >
          <div className="whitespace-pre-wrap text-foreground">{program.program_summary}</div>

          {program.sales_strategies && (
            <>
              <Separator className="my-6" />
              <h3 className="text-lg font-semibold">Sales Strategies</h3>
              <div className="whitespace-pre-wrap text-foreground">{program.sales_strategies}</div>
            </>
          )}

          {program.target_borrower && (
            <>
              <Separator className="my-6" />
              <h3 className="text-lg font-semibold">Target Borrower</h3>
              <p className="text-foreground">{program.target_borrower}</p>
            </>
          )}

          {program.guidelines_url && (
            <>
              <Separator className="my-6" />
              <h3 className="text-lg font-semibold">Guidelines</h3>
              <a
                href={program.guidelines_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                View Full Guidelines →
              </a>
            </>
          )}
        </CardContent>
      </Card>

      {/* Acknowledgment Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Acknowledgment Required</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!hasScrolledToBottom && (
            <p className="text-sm text-muted-foreground italic">
              Please scroll through the entire document above before acknowledging.
            </p>
          )}

          <div className="flex items-start gap-3">
            <Checkbox
              id="agree"
              checked={agreedToTerms}
              onCheckedChange={(checked) => setAgreedToTerms(checked === true)}
              disabled={!hasScrolledToBottom}
            />
            <label htmlFor="agree" className="text-sm text-foreground leading-relaxed cursor-pointer">
              I have read and understand the above program. I agree to comply with all requirements
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
            disabled={!canAcknowledge || acknowledgeProgram.isPending}
            className="w-full"
          >
            {acknowledgeProgram.isPending ? (
              <><Clock className="h-4 w-4 mr-2 animate-spin" /> Processing...</>
            ) : (
              <><CheckCircle2 className="h-4 w-4 mr-2" /> Acknowledge Program</>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProgramViewer;
