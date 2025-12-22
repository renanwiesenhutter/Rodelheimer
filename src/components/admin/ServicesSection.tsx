import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
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
import { Plus, Edit, Trash2, Scissors, X, GripVertical } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Service } from './types';

// Opções de tempo disponíveis em minutos
const DURATION_OPTIONS = [10, 15, 20, 30, 45, 60, 75, 90];

// Converter minutos para slots (arredondando para cima)
const minutesToSlots = (minutes: number): number => {
  return Math.ceil(minutes / 30);
};

// Converter slots para minutos
const slotsToMinutes = (slots: number): number => {
  return slots * 30;
};

// Remover símbolo de euro do preço (para exibição no input)
const removeEuroSymbol = (price: string): string => {
  return price.replace(/€/g, '').trim();
};

// Adicionar símbolo de euro ao preço (para salvar no banco)
const addEuroSymbol = (price: string): string => {
  const numericValue = price.replace(/[^\d,.]/g, '').trim();
  return numericValue ? `${numericValue}€` : '';
};

const ServicesSection = () => {
  const { toast } = useToast();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [deletingService, setDeletingService] = useState<Service | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    price: '',
    description: '',
    duration_minutes: 30, // Em minutos, não slots
    is_combined: false,
  });

  useEffect(() => {
    fetchServices();
  }, []);

  useEffect(() => {
    if (!isDialogOpen) return;

    const prevOverflow = document.body.style.overflow;
    const prevPaddingRight = document.body.style.paddingRight;

    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = 'hidden';
    if (scrollbarWidth > 0) document.body.style.paddingRight = `${scrollbarWidth}px`;

    return () => {
      document.body.style.overflow = prevOverflow;
      document.body.style.paddingRight = prevPaddingRight;
    };
  }, [isDialogOpen]);

  const fetchServices = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .order('display_order', { ascending: true })
      .order('name', { ascending: true });

    if (error) {
      toast({
        title: 'Fehler',
        description: 'Die Dienstleistungen konnten nicht geladen werden.',
        variant: 'destructive',
      });
    } else {
      setServices((data ?? []) as Service[]);
    }
    setLoading(false);
  };

  const handleOpenDialog = (service?: Service) => {
    if (service) {
      setEditingService(service);
      setFormData({
        name: service.name,
        price: removeEuroSymbol(service.price), // Remove € para exibição no input
        description: service.description || '',
        duration_minutes: service.duration_minutes ?? slotsToMinutes(service.duration_slots),
        is_combined: service.is_combined ?? false,
      });
    } else {
      setEditingService(null);
      setFormData({
        name: '',
        price: '',
        description: '',
        duration_minutes: 30,
        is_combined: false,
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingService(null);
    setFormData({
      name: '',
      price: '',
      description: '',
      duration_minutes: 30,
      is_combined: false,
    });
  };

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.price.trim()) {
      toast({
        title: 'Fehler',
        description: 'Bitte füllen Sie alle Pflichtfelder aus.',
        variant: 'destructive',
      });
      return;
    }

    if (formData.duration_minutes < 10) {
      toast({
        title: 'Fehler',
        description: 'Die Dauer muss mindestens 10 Minuten betragen.',
        variant: 'destructive',
      });
      return;
    }

    // Converter minutos para slots
    const duration_slots = minutesToSlots(formData.duration_minutes);

    try {
      // Adicionar símbolo de euro ao preço antes de salvar
      const priceWithEuro = addEuroSymbol(formData.price);

      if (editingService) {
        const { error } = await supabase
          .from('services')
          .update({
            name: formData.name.trim(),
            price: priceWithEuro,
            description: formData.description.trim() || null,
            duration_slots: duration_slots,
            duration_minutes: formData.duration_minutes,
            is_combined: formData.is_combined,
          })
          .eq('id', editingService.id);

        if (error) throw error;

        toast({
          title: 'Erfolg!',
          description: 'Die Dienstleistung wurde aktualisiert.',
        });
      } else {
        // Get the max display_order and add 1 for the new service
        const maxOrder = services.length > 0 
          ? Math.max(...services.map(s => s.display_order ?? 0))
          : -1;

        const { error } = await supabase
          .from('services')
          .insert({
            name: formData.name.trim(),
            price: priceWithEuro,
            description: formData.description.trim() || null,
            duration_slots: duration_slots,
            duration_minutes: formData.duration_minutes,
            is_combined: formData.is_combined,
            display_order: maxOrder + 1,
          });

        if (error) throw error;

        toast({
          title: 'Erfolg!',
          description: 'Die Dienstleistung wurde erstellt.',
        });
      }

      handleCloseDialog();
      fetchServices();
    } catch (error: any) {
      toast({
        title: 'Fehler',
        description: error.message || 'Ein Fehler ist aufgetreten.',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteClick = (service: Service) => {
    setDeletingService(service);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingService) return;

    try {
      const { error } = await supabase
        .from('services')
        .delete()
        .eq('id', deletingService.id);

      if (error) throw error;

      toast({
        title: 'Erfolg!',
        description: 'Die Dienstleistung wurde gelöscht.',
      });

      setIsDeleteDialogOpen(false);
      setDeletingService(null);
      fetchServices();
    } catch (error: any) {
      toast({
        title: 'Fehler',
        description: error.message || 'Die Dienstleistung konnte nicht gelöscht werden.',
        variant: 'destructive',
      });
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = services.findIndex((s) => s.id === active.id);
    const newIndex = services.findIndex((s) => s.id === over.id);

    if (oldIndex === -1 || newIndex === -1) {
      return;
    }

    const newServices = arrayMove(services, oldIndex, newIndex);
    setServices(newServices);

    // Update display_order in database
    try {
      const updates = newServices.map((service, index) => ({
        id: service.id,
        display_order: index,
      }));

      // Update all services in a batch
      for (const update of updates) {
        const { error } = await supabase
          .from('services')
          .update({ display_order: update.display_order })
          .eq('id', update.id);

        if (error) throw error;
      }

      toast({
        title: 'Erfolg!',
        description: 'Die Reihenfolge wurde aktualisiert.',
      });
    } catch (error: any) {
      // Revert on error
      setServices(services);
      toast({
        title: 'Fehler',
        description: error.message || 'Die Reihenfolge konnte nicht aktualisiert werden.',
        variant: 'destructive',
      });
    }
  };

  // Sortable Service Card Component
  const SortableServiceCard = ({ service }: { service: Service }) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id: service.id });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.5 : 1,
    };

    return (
      <div
        ref={setNodeRef}
        style={style}
        className="bg-card border border-border rounded-lg p-6 hover:shadow-md transition-shadow"
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2">
            <div
              {...attributes}
              {...listeners}
              className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded"
              title="Zum Verschieben ziehen"
            >
              <GripVertical className="w-5 h-5 text-muted-foreground" />
            </div>
            <div className="p-3 bg-primary rounded-lg">
              <Scissors className="w-5 h-5 text-primary-foreground" />
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleOpenDialog(service)}
              className="h-8 w-8"
            >
              <Edit className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleDeleteClick(service)}
              className="h-8 w-8 text-destructive hover:text-destructive"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <h3 className="font-display text-xl font-semibold text-foreground mb-2">
          {service.name}
        </h3>

        <p className="text-2xl font-bold text-foreground mb-2">{service.price}</p>

        {service.description && (
          <p className="text-muted-foreground text-sm mb-4">{service.description}</p>
        )}

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Dauer: {service.duration_minutes ?? service.duration_slots * 30} Min</span>
        </div>
      </div>
    );
  };

  return (
    <div id="servicos" className="scroll-mt-24">
      <div className="text-center mb-12">
        <p className="text-muted-foreground font-body text-sm tracking-[0.2em] uppercase mb-4">
          Services Management
        </p>
        <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
          Dienstleistungen verwalten
        </h2>
        <div className="w-20 h-1 bg-foreground mx-auto" />
      </div>

      <div className="mb-6 flex justify-center">
        <Button onClick={() => handleOpenDialog()} className="btn-primary">
          <Plus className="w-4 h-4 mr-2" />
          Neue Dienstleistung
        </Button>
      </div>

      {loading ? (
        <div className="text-center text-muted-foreground py-12">Lädt...</div>
      ) : services.length === 0 ? (
        <div className="text-center text-muted-foreground py-12">
          Keine Dienstleistungen vorhanden.
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={services.map((s) => s.id)}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {services.map((service) => (
                <SortableServiceCard key={service.id} service={service} />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Create/Edit Dialog */}
      {isDialogOpen && (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={handleCloseDialog}
            aria-hidden="true"
          />

          <div className="absolute inset-0 overflow-y-auto overscroll-contain">
            <div className="min-h-[100dvh] flex items-start justify-center p-4 sm:p-6">
              <div className="w-full max-w-3xl bg-card border border-border rounded-2xl shadow-lg overflow-hidden">
                <div className="px-6 py-4 border-b border-border flex items-center justify-between">
                  <div className="min-w-0">
                    <h3 className="font-display text-xl font-semibold">
                      {editingService ? 'Dienstleistung bearbeiten' : 'Neue Dienstleistung'}
                    </h3>
                  </div>

                  <Button variant="ghost" size="icon" onClick={handleCloseDialog} title="Schließen">
                    <X className="w-5 h-5" />
                  </Button>
                </div>

                <div className="p-6 grid grid-cols-1 md:grid-cols-[1fr_1.1fr] gap-6">
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Name *</p>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="z.B. Maschinenschnitt"
                        className="text-base md:text-sm"
                      />
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Preis *</p>
                      <div className="relative">
                        <Input
                          id="price"
                          type="text"
                          inputMode="decimal"
                          value={formData.price}
                          onChange={(e) => {
                            // Permite apenas números, vírgula e ponto
                            const value = e.target.value.replace(/[^\d,.]/g, '');
                            setFormData({ ...formData, price: value });
                          }}
                          placeholder="z.B. 12"
                          className="text-base md:text-sm pr-8"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
                          €
                        </span>
                      </div>
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Beschreibung</p>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Beschreibung der Dienstleistung..."
                        rows={3}
                        className="text-base md:text-sm"
                      />
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Dauer *</p>
                      <Select
                        value={formData.duration_minutes.toString()}
                        onValueChange={(value) =>
                          setFormData({ ...formData, duration_minutes: parseInt(value) })
                        }
                      >
                        <SelectTrigger id="duration_minutes">
                          <SelectValue placeholder="Dauer auswählen" />
                        </SelectTrigger>
                        <SelectContent>
                          {DURATION_OPTIONS.map((minutes) => (
                            <SelectItem key={minutes} value={minutes.toString()}>
                              {minutes} Minuten
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                        Wählen Sie die Dauer der Dienstleistung aus
                      </p>
                    </div>

                    <div className="flex items-start gap-3 pt-2">
                      <Checkbox
                        id="is_combined"
                        checked={formData.is_combined}
                        onCheckedChange={(checked) =>
                          setFormData({ ...formData, is_combined: checked === true })
                        }
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <Label
                          htmlFor="is_combined"
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                        >
                          Dienstleistung ist kombinierbar
                        </Label>
                        <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                          Wenn der Service eine kombinierte Leistung ist (z. B. Haarschnitt + Bart).
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">Vorschau</p>
                    <div className="bg-background border border-border rounded-lg p-6 space-y-4">
                      <div>
                        <h4 className="font-display text-lg font-semibold text-foreground mb-2">
                          {formData.name || 'Service Name'}
                        </h4>
                        <p className="text-2xl font-bold text-foreground mb-2">
                          {formData.price ? `${formData.price}€` : 'Preis'}
                        </p>
                        {formData.description && (
                          <p className="text-muted-foreground text-sm mb-4">
                            {formData.description}
                          </p>
                        )}
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>
                            Dauer: {formData.duration_minutes || 30} Min
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-6 border-t border-border flex flex-col sm:flex-row gap-3 justify-end">
                  <Button variant="outline" onClick={handleCloseDialog}>
                    Abbrechen
                  </Button>
                  <Button onClick={handleSave} className="btn-primary w-full sm:w-auto">
                    {editingService ? 'Speichern' : 'Erstellen'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Dienstleistung löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Möchten Sie "{deletingService?.name}" wirklich löschen? Diese Aktion kann nicht
              rückgängig gemacht werden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeletingService(null)}>
              Abbrechen
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ServicesSection;
