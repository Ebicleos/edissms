import { useState } from 'react';
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
import { CLASS_LIST } from '@/types';
import { Mail, MessageSquare, Phone, Send, Users, CheckCircle } from 'lucide-react';

const messageHistory = [
  {
    id: '1',
    subject: 'Mid-Term Exam Schedule',
    recipients: 'All Students & Parents',
    type: 'email',
    sentAt: '2025-01-15 09:30 AM',
    status: 'delivered',
  },
  {
    id: '2',
    subject: 'PTA Meeting Reminder',
    recipients: 'Primary 5 Parents',
    type: 'sms',
    sentAt: '2025-01-14 02:00 PM',
    status: 'delivered',
  },
  {
    id: '3',
    subject: 'School Fees Reminder',
    recipients: 'Pending Payments',
    type: 'whatsapp',
    sentAt: '2025-01-13 11:00 AM',
    status: 'delivered',
  },
];

export default function Messages() {
  const [selectedType, setSelectedType] = useState('email');
  const [recipientType, setRecipientType] = useState('all');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

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
                    <SelectItem value="all">All Students & Parents</SelectItem>
                    <SelectItem value="students">All Students</SelectItem>
                    <SelectItem value="parents">All Parents</SelectItem>
                    <SelectItem value="teachers">All Teachers</SelectItem>
                    <SelectItem value="class">Specific Class</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {recipientType === 'class' && (
                <div>
                  <Label>Select Class</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a class" />
                    </SelectTrigger>
                    <SelectContent>
                      {CLASS_LIST.map((cls) => (
                        <SelectItem key={cls.id} value={cls.id}>
                          {cls.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
              <Button className="w-full bg-gradient-primary hover:opacity-90" size="lg">
                <Send className="mr-2 h-5 w-5" />
                Send {selectedType === 'email' ? 'Email' : selectedType === 'sms' ? 'SMS' : 'WhatsApp Message'}
              </Button>
            </div>
          </div>
        </div>

        {/* Right Column - Message History */}
        <div className="space-y-4">
          <div className="bg-card rounded-xl border border-border/50 p-6 shadow-sm">
            <h3 className="font-semibold text-foreground mb-4">Recent Messages</h3>
            <div className="space-y-4">
              {messageHistory.map((msg) => (
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
                    <span className="text-xs text-muted-foreground">{msg.sentAt}</span>
                  </div>
                  <p className="font-medium text-foreground text-sm">{msg.subject}</p>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Users className="h-3 w-3" />
                      {msg.recipients}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-success">
                      <CheckCircle className="h-3 w-3" />
                      {msg.status}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
