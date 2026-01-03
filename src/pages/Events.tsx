import { useState, useEffect, useMemo } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Switch } from '@/components/ui/switch';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Plus, Calendar, Edit, Trash2, MapPin, Clock, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format, isSameDay, parseISO, isAfter, isBefore, startOfToday } from 'date-fns';

interface Event {
  id: string;
  title: string;
  description: string | null;
  event_date: string;
  start_time: string | null;
  end_time: string | null;
  location: string | null;
  is_all_day: boolean;
  event_type: 'general' | 'academic' | 'holiday' | 'sports' | 'cultural';
  is_published: boolean;
  created_at: string;
  created_by: string | null;
}

const eventTypeColors = {
  general: 'bg-gray-100 text-gray-800',
  academic: 'bg-blue-100 text-blue-800',
  holiday: 'bg-green-100 text-green-800',
  sports: 'bg-orange-100 text-orange-800',
  cultural: 'bg-purple-100 text-purple-800',
};

export default function Events() {
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [location, setLocation] = useState('');
  const [isAllDay, setIsAllDay] = useState(false);
  const [eventType, setEventType] = useState<'general' | 'academic' | 'holiday' | 'sports' | 'cultural'>('general');
  const [isPublished, setIsPublished] = useState(true);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .order('event_date', { ascending: true });

    if (!error && data) {
      setEvents(data as Event[]);
    }
    setIsLoading(false);
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setEventDate('');
    setStartTime('');
    setEndTime('');
    setLocation('');
    setIsAllDay(false);
    setEventType('general');
    setIsPublished(true);
    setSelectedEvent(null);
  };

  const handleOpenCreate = () => {
    resetForm();
    if (selectedDate) {
      setEventDate(format(selectedDate, 'yyyy-MM-dd'));
    }
    setDialogOpen(true);
  };

  const handleOpenEdit = (event: Event) => {
    setSelectedEvent(event);
    setTitle(event.title);
    setDescription(event.description || '');
    setEventDate(event.event_date);
    setStartTime(event.start_time || '');
    setEndTime(event.end_time || '');
    setLocation(event.location || '');
    setIsAllDay(event.is_all_day);
    setEventType(event.event_type);
    setIsPublished(event.is_published);
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !eventDate) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);

    const eventData = {
      title,
      description: description || null,
      event_date: eventDate,
      start_time: isAllDay ? null : startTime || null,
      end_time: isAllDay ? null : endTime || null,
      location: location || null,
      is_all_day: isAllDay,
      event_type: eventType,
      is_published: isPublished,
      created_by: user?.id,
    };

    let error;
    if (selectedEvent) {
      ({ error } = await supabase
        .from('events')
        .update(eventData)
        .eq('id', selectedEvent.id));
    } else {
      ({ error } = await supabase.from('events').insert(eventData));
    }

    setIsSubmitting(false);

    if (error) {
      toast.error('Failed to save event');
      return;
    }

    toast.success(selectedEvent ? 'Event updated!' : 'Event created!');
    setDialogOpen(false);
    resetForm();
    fetchEvents();
  };

  const handleDelete = async () => {
    if (!selectedEvent) return;

    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', selectedEvent.id);

    if (error) {
      toast.error('Failed to delete event');
      return;
    }

    toast.success('Event deleted');
    setDeleteDialogOpen(false);
    setSelectedEvent(null);
    fetchEvents();
  };

  // Get events for selected date
  const selectedDateEvents = useMemo(() => {
    if (!selectedDate) return [];
    return events.filter(event => isSameDay(parseISO(event.event_date), selectedDate));
  }, [events, selectedDate]);

  // Get upcoming events
  const upcomingEvents = useMemo(() => {
    const today = startOfToday();
    return events.filter(event => !isBefore(parseISO(event.event_date), today)).slice(0, 5);
  }, [events]);

  // Get dates with events for calendar highlighting
  const eventDates = useMemo(() => {
    return events.map(event => parseISO(event.event_date));
  }, [events]);

  if (isLoading) {
    return (
      <MainLayout title="Events Calendar" subtitle="Manage school events and calendar">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Events Calendar" subtitle="Manage school events and calendar">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
        {/* Calendar */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Calendar</CardTitle>
              <Button size="sm" onClick={handleOpenCreate} className="bg-gradient-primary">
                <Plus className="h-4 w-4 mr-1" />
                Add
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <CalendarComponent
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              className="rounded-md border p-0"
              modifiers={{
                hasEvent: eventDates,
              }}
              modifiersStyles={{
                hasEvent: {
                  fontWeight: 'bold',
                  backgroundColor: 'hsl(var(--primary) / 0.1)',
                },
              }}
            />
          </CardContent>
        </Card>

        {/* Events for Selected Date */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>
              {selectedDate ? format(selectedDate, 'EEEE, MMMM d, yyyy') : 'Select a Date'}
            </CardTitle>
            <CardDescription>
              {selectedDateEvents.length} event(s) on this day
            </CardDescription>
          </CardHeader>
          <CardContent>
            {selectedDateEvents.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No events scheduled for this day.</p>
                <Button variant="outline" className="mt-4" onClick={handleOpenCreate}>
                  Create Event
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {selectedDateEvents.map((event) => (
                  <div
                    key={event.id}
                    className="flex items-start justify-between p-4 rounded-lg border bg-card hover:bg-muted/30 transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge className={eventTypeColors[event.event_type]}>
                          {event.event_type}
                        </Badge>
                        <h4 className="font-semibold">{event.title}</h4>
                      </div>
                      {event.description && (
                        <p className="text-sm text-muted-foreground">{event.description}</p>
                      )}
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        {event.is_all_day ? (
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            All Day
                          </span>
                        ) : event.start_time && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {event.start_time}{event.end_time && ` - ${event.end_time}`}
                          </span>
                        )}
                        {event.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {event.location}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(event)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setSelectedEvent(event);
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Events */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Upcoming Events</CardTitle>
            <CardDescription>Next {upcomingEvents.length} scheduled events</CardDescription>
          </CardHeader>
          <CardContent>
            {upcomingEvents.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No upcoming events scheduled.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                {upcomingEvents.map((event) => (
                  <Card key={event.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleOpenEdit(event)}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <Badge className={eventTypeColors[event.event_type]} variant="secondary">
                          {event.event_type}
                        </Badge>
                      </div>
                      <CardTitle className="text-sm">{event.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <p className="text-xs text-muted-foreground">
                        {format(parseISO(event.event_date), 'MMM d, yyyy')}
                      </p>
                      {event.location && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                          <MapPin className="h-3 w-3" />
                          {event.location}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedEvent ? 'Edit Event' : 'New Event'}</DialogTitle>
            <DialogDescription>
              {selectedEvent ? 'Update event details.' : 'Create a new event for the school calendar.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="event-title">Title *</Label>
              <Input
                id="event-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter event title"
                required
              />
            </div>
            <div>
              <Label htmlFor="event-description">Description</Label>
              <Textarea
                id="event-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Event description..."
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="event-date">Date *</Label>
                <Input
                  id="event-date"
                  type="date"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label>Event Type</Label>
                <Select value={eventType} onValueChange={(v) => setEventType(v as Event['event_type'])}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="academic">Academic</SelectItem>
                    <SelectItem value="holiday">Holiday</SelectItem>
                    <SelectItem value="sports">Sports</SelectItem>
                    <SelectItem value="cultural">Cultural</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div>
                <p className="font-medium">All Day Event</p>
                <p className="text-sm text-muted-foreground">Event lasts the entire day</p>
              </div>
              <Switch checked={isAllDay} onCheckedChange={setIsAllDay} />
            </div>
            {!isAllDay && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start-time">Start Time</Label>
                  <Input
                    id="start-time"
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="end-time">End Time</Label>
                  <Input
                    id="end-time"
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                  />
                </div>
              </div>
            )}
            <div>
              <Label htmlFor="event-location">Location</Label>
              <Input
                id="event-location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Event location"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="bg-gradient-primary">
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : selectedEvent ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Event?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{selectedEvent?.title}". This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
}
