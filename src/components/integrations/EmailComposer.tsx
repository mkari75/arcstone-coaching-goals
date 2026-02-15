import { useState } from 'react';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useSendEmail } from '@/hooks/useOutlookIntegration';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Send } from 'lucide-react';

interface EmailComposerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultTo?: string;
  contactId?: string;
}

export function EmailComposer({ open, onOpenChange, defaultTo, contactId }: EmailComposerProps) {
  const { session } = useAuth();
  const user = session?.user;
  const sendEmail = useSendEmail(user?.id || '');
  const [to, setTo] = useState(defaultTo || '');
  const [cc, setCc] = useState('');
  const [bcc, setBcc] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');

  const { data: templates } = useQuery({
    queryKey: ['email-templates', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('email_templates')
        .select('*')
        .eq('user_id', user?.id)
        .order('name');
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id && open,
  });

  const handleTemplateSelect = (templateId: string) => {
    const template = templates?.find(t => t.id === templateId);
    if (template) {
      setSubject(template.subject);
      setBody(template.body);
      setSelectedTemplate(templateId);
    }
  };

  const handleSend = async () => {
    await sendEmail.mutateAsync({
      to: to.split(',').map(e => e.trim()),
      cc: cc ? cc.split(',').map(e => e.trim()) : undefined,
      bcc: bcc ? bcc.split(',').map(e => e.trim()) : undefined,
      subject,
      body,
      contactId,
    });

    if (selectedTemplate) {
      await supabase.rpc('increment_template_use_count', { template_uuid: selectedTemplate });
    }

    setTo(''); setCc(''); setBcc(''); setSubject(''); setBody(''); setSelectedTemplate('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Compose Email</DialogTitle>
          <DialogDescription>Send an email through your connected Outlook account</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {templates && templates.length > 0 && (
            <div className="space-y-1">
              <Label>Use Template (Optional)</Label>
              <Select value={selectedTemplate} onValueChange={handleTemplateSelect}>
                <SelectTrigger><SelectValue placeholder="Select a template..." /></SelectTrigger>
                <SelectContent>
                  {templates.map(template => (
                    <SelectItem key={template.id} value={template.id}>{template.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-1">
            <Label>To *</Label>
            <Input placeholder="email@example.com" value={to} onChange={e => setTo(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>CC</Label>
            <Input placeholder="cc@example.com" value={cc} onChange={e => setCc(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>BCC</Label>
            <Input placeholder="bcc@example.com" value={bcc} onChange={e => setBcc(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Subject</Label>
            <Input placeholder="Email subject" value={subject} onChange={e => setSubject(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Body</Label>
            <Textarea placeholder="Type your message..." value={body} onChange={e => setBody(e.target.value)} rows={8} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSend} disabled={!to || !subject || sendEmail.isPending}>
            <Send className="mr-2 h-4 w-4" />
            {sendEmail.isPending ? 'Sending...' : 'Send'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
