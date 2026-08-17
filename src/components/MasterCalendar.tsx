import { useEffect, useState } from "react";
import { Calendar as CalendarIcon, Clock, MapPin, Plus, Trash2, Search, Building, User } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "./ui/dialog";
import { Badge } from "./ui/badge";
import { ChurchEvent, Worker } from "../types/models";
import { createChurchEvent, deleteChurchEvent, fetchChurchEvents } from "../utils/api";
import { toast } from "sonner";

interface MasterCalendarProps {
  workers: Worker[];
}

export function MasterCalendar({ workers }: MasterCalendarProps) {
  const [events, setEvents] = useState<ChurchEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [roomFilter, setRoomFilter] = useState("all");

  // Create Event Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [eventDate, setEventDate] = useState(new Date().toISOString().split("T")[0]);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("11:00");
  const [roomLocation, setRoomLocation] = useState("Main Sanctuary");
  const [organizerId, setOrganizerId] = useState("");

  const loadEvents = async () => {
    try {
      setLoading(true);
      const data = await fetchChurchEvents();
      setEvents(data);
    } catch {
      toast.error("Failed to load church calendar events");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadEvents();
  }, []);

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !eventDate) {
      toast.error("Event title and date are required");
      return;
    }

    try {
      await createChurchEvent({
        title,
        description,
        event_date: eventDate,
        start_time: startTime,
        end_time: endTime,
        room_location: roomLocation,
        organizer_id: organizerId ? Number(organizerId) : undefined,
      });
      toast.success("Church event scheduled!");
      setIsModalOpen(false);
      setTitle("");
      setDescription("");
      void loadEvents();
    } catch {
      toast.error("Failed to schedule event");
    }
  };

  const handleDeleteEvent = async (id: number) => {
    if (!confirm("Are you sure you want to remove this calendar event?")) return;
    try {
      await deleteChurchEvent(id);
      toast.success("Event removed from calendar");
      void loadEvents();
    } catch {
      toast.error("Failed to remove event");
    }
  };

  const filteredEvents = events.filter((e) => {
    const matchesSearch =
      e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.room_location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (e.description && e.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesRoom = roomFilter === "all" || e.room_location === roomFilter;
    return matchesSearch && matchesRoom;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Master Church Calendar & Room Booking</h1>
          <p className="text-slate-500 text-sm">
            Schedule church-wide services, hall reservations, choir rehearsals, and avoid room conflicts.
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="bg-slate-900 hover:bg-slate-800 text-white gap-2">
          <Plus className="w-4 h-4" /> Schedule Event / Reserve Room
        </Button>
      </div>

      {/* Filter & Search */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <Input
            placeholder="Search event title, hall, or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 text-sm"
          />
        </div>
        <select
          value={roomFilter}
          onChange={(e) => setRoomFilter(e.target.value)}
          className="border border-slate-200 rounded-md px-3 py-2 text-sm bg-white font-medium text-slate-700 w-full sm:w-auto"
        >
          <option value="all">All Rooms & Halls</option>
          <option value="Main Sanctuary">Main Sanctuary</option>
          <option value="Grace Hall">Grace Hall</option>
          <option value="Choir Room">Choir Room</option>
          <option value="Youth Chapel">Youth Chapel</option>
        </select>
      </div>

      {/* Events List / Grid */}
      {loading ? (
        <div className="p-12 text-center text-slate-500">Loading church calendar...</div>
      ) : filteredEvents.length === 0 ? (
        <div className="p-12 text-center bg-white border border-slate-200 rounded-2xl text-slate-500">
          No calendar events scheduled.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredEvents.map((ev) => (
            <Card key={ev.id} className="border-slate-200 shadow-sm hover:shadow-md transition-shadow bg-white flex flex-col justify-between">
              <CardHeader className="p-5 pb-3">
                <div className="flex items-start justify-between">
                  <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200 text-xs font-semibold">
                    {ev.event_date}
                  </Badge>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDeleteEvent(ev.id)}
                    className="h-8 w-8 p-0 text-red-600 hover:bg-red-50"
                    title="Remove Event"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
                <CardTitle className="text-lg font-bold text-slate-900 mt-2">{ev.title}</CardTitle>
                {ev.description ? (
                  <CardDescription className="text-xs text-slate-500 line-clamp-2 mt-1">
                    {ev.description}
                  </CardDescription>
                ) : null}
              </CardHeader>
              <CardContent className="p-5 pt-0 space-y-3">
                <div className="space-y-2 text-xs text-slate-600 pt-3 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-slate-400" />
                    <span className="font-semibold text-slate-800">Time:</span> {ev.start_time} - {ev.end_time}
                  </div>
                  <div className="flex items-center gap-2">
                    <Building className="w-4 h-4 text-slate-400" />
                    <span className="font-semibold text-slate-800">Room:</span> {ev.room_location}
                  </div>
                  {ev.organizer_name ? (
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-slate-400" />
                      <span className="font-semibold text-slate-800">Organizer:</span> {ev.organizer_name}
                    </div>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal: Schedule Event */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Schedule Church Event / Reserve Hall</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateEvent} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Event Title *</label>
              <Input placeholder="e.g. Midweek Bible Exposition" value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Date *</label>
                <Input type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Start Time</label>
                <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">End Time</label>
                <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Reserved Hall / Room</label>
                <select
                  value={roomLocation}
                  onChange={(e) => setRoomLocation(e.target.value)}
                  className="w-full border border-slate-300 rounded-md p-2 text-xs"
                >
                  <option value="Main Sanctuary">Main Sanctuary</option>
                  <option value="Grace Hall">Grace Hall</option>
                  <option value="Choir Room">Choir Room</option>
                  <option value="Youth Chapel">Youth Chapel</option>
                  <option value="Outdoor Grounds">Outdoor Grounds</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Organizer / Host</label>
                <select
                  value={organizerId}
                  onChange={(e) => setOrganizerId(e.target.value)}
                  className="w-full border border-slate-300 rounded-md p-2 text-xs"
                >
                  <option value="">Select Host Worker</option>
                  {workers.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} ({w.department})
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Description / Agenda Notes</label>
              <textarea
                placeholder="Write event description..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full border border-slate-300 rounded-md p-2 text-xs min-h-[60px]"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-slate-900 text-white">Schedule Event</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
