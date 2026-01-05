import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { CLASS_LIST_DETAILED } from '@/types';
import { Mail, MessageSquare, Phone, Send, Users, CheckCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { messageSchema, validateInput } from '@/lib/validations';

interface Message {
  id: string;
  subject: string | null;
  recipients_type: string;
  type: string;
  sent_at: string;
  status: string;
  class_id: string | null;
}

interface TeacherClass {
  class_id: string;
}

export default function Messages() {
  const { user, role } = useAuth();
  const [selectedType, setSelectedType] = useState('email');
  const [recipientType, setRecipientType] = useState('all');
  const [selectedClass, setSelectedClass] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messageHistory, setMessageHistory] = useState<Message[]>([]);
  const [teacherClasses, setTeacherClasses] = useState<string[]>([]);

  useEffect(() => {
    fetchMessages();
    if (role === 'teacher') {
      fetchTeacherClasses();
    }
  }, [role]);

  const fetchMessages = async () => {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .order('sent_at', { ascending: false })
      .limit(10);

    if (!error && data) {
      setMessageHistory(data);
    }
  };

  const fetchTeacherClasses = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('teacher_classes')
      .select('class_id')
      .eq('teacher_id', user.id);

    if (!error && data) {
      setTeacherClasses(data.map(tc => tc.class_id));
    }
  };

  const handleSendMessage = async () => {
    // Validate input using schema
    const validation = validateInput(messageSchema, {
      content: message,
      subject: selectedType === 'email' ? subject : undefined,
      recipients_type: recipientType === 'my_students' ? 'class' : recipientType,
      type: selectedType as 'sms' | 'email' | 'both',
      class_id: recipientType === 'class' ? selectedClass : (recipientType === 'my_students' && teacherClasses.length > 0 ? teacherClasses[0] : undefined),
    });

    if (validation.success === false) {
      toast.error(validation.error);
      return;
    }

    const validatedData = validation.data;

    if (recipientType === 'class' && !selectedClass) {
      toast.error('Please select a class');
      return;
    }

    setIsLoading(true);

    try {
      // For WhatsApp, invoke the edge function
      if (selectedType === 'whatsapp') {
        const { data, error: whatsappError } = await supabase.functions.invoke('send-whatsapp', {
          body: {
            message: validatedData.content,
            recipient_type: validatedData.recipients_type,
            class_id: validatedData.class_id,
          },
        });

        if (whatsappError) throw whatsappError;

        toast.success('WhatsApp message queued!', {
          description: data?.note || `Message sent to ${recipientType === 'class' ? selectedClass : recipientType}`,
        });
      } else {
        // For email/SMS, store in database
        const { error } = await supabase.from('messages').insert({
          type: validatedData.type,
          subject: validatedData.subject || null,
          content: validatedData.content,
          recipients_type: validatedData.recipients_type,
          class_id: validatedData.class_id || null,
          sent_by: user?.id,
          status: 'sent',
        });

        if (error) throw error;

        toast.success(`${selectedType.toUpperCase()} sent successfully!`, {
          description: `Message sent to ${recipientType === 'class' ? selectedClass : recipientType}`,
        });
      }

      // Reset form
      setSubject('');
      setMessage('');
      fetchMessages();
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setIsLoading(false);
    }

    toast.success(`${selectedType.toUpperCase()} sent successfully!`, {
      description: `Message sent to ${recipientType === 'class' ? selectedClass : recipientType}`,
    });

    // Reset form
    setSubject('');
    setMessage('');
    fetchMessages();
  };

  const getRecipientLabel = (type: string, classId: string | null) => {
    if (type === 'class' && classId) return classId;
    if (type === 'all') return 'All Students & Parents';
    if (type === 'students') return 'All Students';
    if (type === 'parents') return 'All Parents';
    if (type === 'teachers') return 'All Teachers';
    if (type === 'my_students') return 'My Class Students';
    return type;
  };

  return (
    <MainLayout title="Messages" subtitle="Send emails, SMS, and WhatsApp messages">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
        {/* Left Column - Compose Message */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card rounded-xl border border-border/50 p-6 shadow-sm">
            <h3 className="font-semibold text-foreground mb-4">Compose Message</h3>
            
            {/* Message Type Selection */}
            <Tabs value={selectedType} onValueChange={setSelectedType} className="mb-6">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="email" className="gap-2">
                  <Mail className="h-4 w-4" />
                  Email
                </TabsTrigger>
                <TabsTrigger value="sms" className="gap-2">
                  <Phone className="h-4 w-4" />
                  SMS
                </TabsTrigger>
                <TabsTrigger value="whatsapp" className="gap-2">
                  <MessageSquare className="h-4 w-4" />
                  WhatsApp
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="space-y-4">
              {/* Recipients */}
              <div>
                <Label>Recipients</Label>
                <Select value={recipientType} onValueChange={setRecipientType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select recipients" />
                  </SelectTrigger>
                  <SelectContent>
                    {role === 'admin' && (
                      <>
                        <SelectItem value="all">All Students & Parents</SelectItem>
                        <SelectItem value="students">All Students</SelectItem>
                        <SelectItem value="parents">All Parents</SelectItem>
                        <SelectItem value="teachers">All Teachers</SelectItem>
                      </>
                    )}
                    {role === 'teacher' && (
                      <SelectItem value="my_students">My Class Students</SelectItem>
                    )}
                    <SelectItem value="class">Specific Class</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {recipientType === 'class' && (
                <div>
                  <Label>Select Class</Label>
                  <Select value={selectedClass} onValueChange={setSelectedClass}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a class" />
                    </SelectTrigger>
                    <SelectContent>
                      {(role === 'teacher' ? CLASS_LIST_DETAILED.filter(cls => teacherClasses.includes(cls.id)) : CLASS_LIST_DETAILED).map((cls) => (
                        <SelectItem key={cls.id} value={cls.id}>
                          {cls.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {role === 'teacher' && teacherClasses.length === 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      No classes assigned. Please contact admin.
                    </p>
                  )}
                </div>
              )}

              {/* Subject (for email) */}
              {selectedType === 'email' && (
                <div>
                  <Label htmlFor="subject">Subject</Label>
                  <Input
                    id="subject"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Enter email subject"
                  />
                </div>
              )}

              {/* Message */}
              <div>
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type your message here..."
                  rows={6}
                  maxLength={1000}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {message.length} / 1000 characters
                </p>
              </div>

              {/* Options */}
              <div className="flex items-center gap-4 pt-2">
                <div className="flex items-center gap-2">
                  <Checkbox id="schedule" />
                  <Label htmlFor="schedule" className="text-sm font-normal cursor-pointer">
                    Schedule for later
                  </Label>
                </div>
              </div>

              {/* Send Button */}
              <Button 
                className="w-full bg-gradient-primary hover:opacity-90" 
                size="lg"
                onClick={handleSendMessage}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-5 w-5" />
                    Send {selectedType === 'email' ? 'Email' : selectedType === 'sms' ? 'SMS' : 'WhatsApp Message'}
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Right Column - Message History */}
        <div className="space-y-4">
          <div className="bg-card rounded-xl border border-border/50 p-6 shadow-sm">
            <h3 className="font-semibold text-foreground mb-4">Recent Messages</h3>
            <div className="space-y-4">
              {messageHistory.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No messages sent yet</p>
              ) : (
                messageHistory.map((msg) => (
                  <div
                    key={msg.id}
                    className="p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <Badge
                        variant="outline"
                        className={
                          msg.type === 'email'
                            ? 'border-primary text-primary'
                            : msg.type === 'sms'
                            ? 'border-secondary text-secondary'
                            : 'border-success text-success'
                        }
                      >
                        {msg.type === 'email' ? (
                          <Mail className="h-3 w-3 mr-1" />
                        ) : msg.type === 'sms' ? (
                          <Phone className="h-3 w-3 mr-1" />
                        ) : (
                          <MessageSquare className="h-3 w-3 mr-1" />
                        )}
                        {msg.type.toUpperCase()}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(msg.sent_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="font-medium text-foreground text-sm">
                      {msg.subject || 'No Subject'}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Users className="h-3 w-3" />
                        {getRecipientLabel(msg.recipients_type, msg.class_id)}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-success">
                        <CheckCircle className="h-3 w-3" />
                        {msg.status}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
