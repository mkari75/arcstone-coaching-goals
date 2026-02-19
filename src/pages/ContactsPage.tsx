import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useContactsList, useCreateContact, useUpdateContact, useDeleteContact, useContactActivities } from '@/hooks/useContactsCRUD';
import { ACTIVITY_LABELS } from '@/hooks/useActivities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Search, Plus, Phone, Mail, Building2, User, Activity, X } from 'lucide-react';
import { format } from 'date-fns';

const CONTACT_TYPES = ['prospect', 'client', 'referral_partner', 'realtor', 'builder', 'financial_planner', 'listing_agent', 'buyers_agent', 'other'];

function healthBadge(score: number | null) {
  if (score == null) return <Badge variant="secondary">N/A</Badge>;
  if (score >= 90) return <Badge className="bg-[hsl(var(--success))] text-[hsl(var(--success-foreground))]">Healthy</Badge>;
  if (score >= 60) return <Badge className="bg-[hsl(var(--warning))] text-[hsl(var(--warning-foreground))]">At Risk</Badge>;
  return <Badge variant="destructive">Needs Attention</Badge>;
}

const ContactsPage = () => {
  const { session } = useAuth();
  const userId = session?.user?.id;

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);

  // Form state
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formCompany, setFormCompany] = useState('');
  const [formType, setFormType] = useState('prospect');
  const [formNotes, setFormNotes] = useState('');

  const { data: contacts, isLoading } = useContactsList(userId, { search: search || undefined, contactType: typeFilter || undefined });
  const createContact = useCreateContact();
  const updateContact = useUpdateContact();
  const deleteContact = useDeleteContact();
  const { data: contactActivities } = useContactActivities(detailId ?? undefined);

  const resetForm = () => { setFormName(''); setFormPhone(''); setFormEmail(''); setFormCompany(''); setFormType('prospect'); setFormNotes(''); setEditId(null); };

  const openEdit = (c: any) => {
    setFormName(c.name); setFormPhone(c.phone || ''); setFormEmail(c.email || ''); setFormCompany(c.company || ''); setFormType(c.contact_type); setFormNotes(c.notes || '');
    setEditId(c.id); setShowForm(true);
  };

  const handleSave = async () => {
    if (!formName.trim() || !userId) return;
    if (editId) {
      await updateContact.mutateAsync({ id: editId, updates: { name: formName, phone: formPhone || null, email: formEmail || null, company: formCompany || null, contact_type: formType, notes: formNotes || null } });
    } else {
      await createContact.mutateAsync({ user_id: userId, name: formName, phone: formPhone || null, email: formEmail || null, company: formCompany || null, contact_type: formType, notes: formNotes || null });
    }
    setShowForm(false); resetForm();
  };

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Contacts & Relationships</h1>
          <p className="text-muted-foreground mt-1">Manage your network and track relationship health.</p>
        </div>
        <Button onClick={() => { resetForm(); setShowForm(true); }}><Plus className="h-4 w-4 mr-1" /> Add Contact</Button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search contacts..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="All Types" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {CONTACT_TYPES.map(t => <SelectItem key={t} value={t}>{t.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Contact Grid */}
      {isLoading && <p className="text-center text-muted-foreground py-8">Loading contacts...</p>}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {contacts?.map(contact => (
          <Card key={contact.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setDetailId(contact.id)}>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-full bg-primary/10"><User className="h-4 w-4 text-primary" /></div>
                  <div>
                    <p className="font-medium text-foreground">{contact.name}</p>
                    <p className="text-xs text-muted-foreground capitalize">{contact.contact_type.replace(/_/g, ' ')}</p>
                  </div>
                </div>
                {healthBadge(contact.health_score)}
              </div>
              <div className="space-y-1 text-sm">
                {contact.phone && <div className="flex items-center gap-2 text-muted-foreground"><Phone className="h-3 w-3" />{contact.phone}</div>}
                {contact.email && <div className="flex items-center gap-2 text-muted-foreground"><Mail className="h-3 w-3" />{contact.email}</div>}
                {contact.company && <div className="flex items-center gap-2 text-muted-foreground"><Building2 className="h-3 w-3" />{contact.company}</div>}
              </div>
              {contact.last_contact_date && (
                <p className="text-xs text-muted-foreground">Last contact: {format(new Date(contact.last_contact_date), 'MMM d, yyyy')}</p>
              )}
            </CardContent>
          </Card>
        ))}
        {!isLoading && contacts?.length === 0 && (
          <Card className="col-span-full"><CardContent className="py-12 text-center text-muted-foreground">No contacts yet. Add your first contact!</CardContent></Card>
        )}
      </div>

      {/* Contact Form Dialog */}
      <Dialog open={showForm} onOpenChange={v => { if (!v) resetForm(); setShowForm(v); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editId ? 'Edit Contact' : 'Add Contact'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <Input placeholder="Name *" value={formName} onChange={e => setFormName(e.target.value)} />
            <Input placeholder="Phone" value={formPhone} onChange={e => setFormPhone(e.target.value)} />
            <Input placeholder="Email" value={formEmail} onChange={e => setFormEmail(e.target.value)} />
            <Input placeholder="Company" value={formCompany} onChange={e => setFormCompany(e.target.value)} />
            <Select value={formType} onValueChange={setFormType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {CONTACT_TYPES.map(t => <SelectItem key={t} value={t}>{t.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</SelectItem>)}
              </SelectContent>
            </Select>
            <Textarea placeholder="Notes" value={formNotes} onChange={e => setFormNotes(e.target.value)} />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => { setShowForm(false); resetForm(); }}>Cancel</Button>
              <Button onClick={handleSave} disabled={!formName.trim() || createContact.isPending || updateContact.isPending}>
                {editId ? 'Update' : 'Create'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Contact Detail Dialog */}
      <Dialog open={!!detailId} onOpenChange={v => { if (!v) setDetailId(null); }}>
        <DialogContent className="max-w-lg">
          {(() => {
            const c = contacts?.find(x => x.id === detailId);
            if (!c) return null;
            return (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center justify-between">
                    <span>{c.name}</span>
                    {healthBadge(c.health_score)}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {c.phone && <div><span className="text-muted-foreground">Phone:</span> {c.phone}</div>}
                    {c.email && <div><span className="text-muted-foreground">Email:</span> {c.email}</div>}
                    {c.company && <div><span className="text-muted-foreground">Company:</span> {c.company}</div>}
                    <div><span className="text-muted-foreground">Type:</span> {c.contact_type.replace(/_/g, ' ')}</div>
                    <div><span className="text-muted-foreground">Touches:</span> {c.total_touches ?? 0}</div>
                    <div><span className="text-muted-foreground">Loans:</span> {c.loans_closed ?? 0}</div>
                  </div>
                  {c.notes && <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md">{c.notes}</p>}

                  <div>
                    <h4 className="text-sm font-medium text-foreground mb-2 flex items-center gap-1"><Activity className="h-4 w-4" /> Recent Activities</h4>
                    {contactActivities?.length === 0 && <p className="text-sm text-muted-foreground">No activities recorded.</p>}
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {contactActivities?.map(a => (
                        <div key={a.id} className="flex items-center justify-between text-sm border-b border-border pb-2">
                          <span className="text-foreground">{ACTIVITY_LABELS[a.activity_type] || a.activity_type}</span>
                          <span className="text-muted-foreground text-xs">{a.completed_at ? format(new Date(a.completed_at), 'MMM d') : ''}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => { setDetailId(null); openEdit(c); }}>Edit</Button>
                    <Button variant="destructive" size="sm" onClick={async () => { await deleteContact.mutateAsync(c.id); setDetailId(null); }}>Delete</Button>
                  </div>
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ContactsPage;
