import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { Plus, Edit, Trash2, User, X, Upload, Image as ImageIcon, GripVertical } from 'lucide-react';
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
import type { Barber } from './types';

const BarbersSection = () => {
  const { toast } = useToast();
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [loading, setLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingBarber, setEditingBarber] = useState<Barber | null>(null);
  const [deletingBarber, setDeletingBarber] = useState<Barber | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: '',
    photo_url: '',
  });

  useEffect(() => {
    fetchBarbers();
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

  const fetchBarbers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('barbers')
      .select('*')
      .order('display_order', { ascending: true })
      .order('name', { ascending: true });

    if (error) {
      toast({
        title: 'Fehler',
        description: 'Die Barbiere konnten nicht geladen werden.',
        variant: 'destructive',
      });
    } else {
      setBarbers((data ?? []) as Barber[]);
    }
    setLoading(false);
  };

  const handleOpenDialog = (barber?: Barber) => {
    if (barber) {
      setEditingBarber(barber);
      setFormData({
        name: barber.name,
        photo_url: barber.photo_url || '',
      });
    } else {
      setEditingBarber(null);
      setFormData({
        name: '',
        photo_url: '',
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingBarber(null);
    setFormData({
      name: '',
      photo_url: '',
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Fehler',
        description: 'Bitte wählen Sie eine Bilddatei aus.',
        variant: 'destructive',
      });
      return;
    }

    // Validar tamanho (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'Fehler',
        description: 'Die Datei ist zu groß. Maximale Größe: 5MB.',
        variant: 'destructive',
      });
      return;
    }

    setUploadingPhoto(true);

    try {
      // Se estiver editando e já tiver uma foto, deletar a antiga antes de fazer upload da nova
      if (editingBarber?.photo_url && editingBarber.photo_url !== formData.photo_url) {
        try {
          const url = new URL(editingBarber.photo_url);
          const pathParts = url.pathname.split('/');
          const barbersIndex = pathParts.findIndex(part => part === 'barbers');
          if (barbersIndex !== -1 && barbersIndex < pathParts.length - 1) {
            const fileName = pathParts.slice(barbersIndex + 1).join('/');
            const filePath = `barbers/${fileName}`;
            await supabase.storage.from('barbers').remove([filePath]);
          }
        } catch {
          // Ignorar erro ao deletar foto antiga
        }
      }

      // Criar nome único para o arquivo
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `barbers/${fileName}`;

      // Upload para Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('barbers')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Obter URL pública
      const {
        data: { publicUrl },
      } = supabase.storage.from('barbers').getPublicUrl(filePath);

      setFormData({ ...formData, photo_url: publicUrl });

      toast({
        title: 'Erfolg!',
        description: 'Das Foto wurde hochgeladen.',
      });
    } catch (error: any) {
      toast({
        title: 'Fehler',
        description: error.message || 'Das Foto konnte nicht hochgeladen werden.',
        variant: 'destructive',
      });
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleRemovePhoto = () => {
    setFormData({ ...formData, photo_url: '' });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast({
        title: 'Fehler',
        description: 'Bitte geben Sie einen Namen ein.',
        variant: 'destructive',
      });
      return;
    }

    try {
      if (editingBarber) {
        // Se a foto mudou, deletar a foto antiga
        if (editingBarber.photo_url && editingBarber.photo_url !== formData.photo_url) {
          try {
            // Extrair o caminho do arquivo da URL do Supabase Storage
            const url = new URL(editingBarber.photo_url);
            const pathParts = url.pathname.split('/');
            const barbersIndex = pathParts.findIndex(part => part === 'barbers');
            if (barbersIndex !== -1 && barbersIndex < pathParts.length - 1) {
              const fileName = pathParts.slice(barbersIndex + 1).join('/');
              const filePath = `barbers/${fileName}`;
              await supabase.storage.from('barbers').remove([filePath]);
            }
          } catch {
            // Ignorar erro ao deletar foto antiga
          }
        }

        const { error } = await supabase
          .from('barbers')
          .update({
            name: formData.name.trim(),
            photo_url: formData.photo_url || null,
          })
          .eq('id', editingBarber.id);

        if (error) throw error;

        toast({
          title: 'Erfolg!',
          description: 'Der Barbier wurde aktualisiert.',
        });
      } else {
        // Calcular o próximo display_order
        const maxOrder = barbers.length > 0 
          ? Math.max(...barbers.map(b => b.display_order ?? 0))
          : -1;

        const { error } = await supabase
          .from('barbers')
          .insert({
            name: formData.name.trim(),
            photo_url: formData.photo_url || null,
            services: [], // Campo services ainda existe na tabela, mas não é mais usado
            display_order: maxOrder + 1,
          });

        if (error) throw error;

        toast({
          title: 'Erfolg!',
          description: 'Der Barbier wurde erstellt.',
        });
      }

      handleCloseDialog();
      fetchBarbers();
    } catch (error: any) {
      toast({
        title: 'Fehler',
        description: error.message || 'Ein Fehler ist aufgetreten.',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteClick = (barber: Barber) => {
    setDeletingBarber(barber);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingBarber) return;

    try {
      // Deletar foto do storage se existir
      if (deletingBarber.photo_url) {
        try {
          // Extrair o caminho do arquivo da URL do Supabase Storage
          // URL format: https://[project].supabase.co/storage/v1/object/public/barbers/[filename]
          const url = new URL(deletingBarber.photo_url);
          const pathParts = url.pathname.split('/');
          const barbersIndex = pathParts.findIndex(part => part === 'barbers');
          if (barbersIndex !== -1 && barbersIndex < pathParts.length - 1) {
            const fileName = pathParts.slice(barbersIndex + 1).join('/');
            const filePath = `barbers/${fileName}`;
            await supabase.storage.from('barbers').remove([filePath]);
          }
        } catch (storageError) {
          // Continuar mesmo se não conseguir deletar a foto
          console.warn('Foto não pôde ser deletada do storage:', storageError);
        }
      }

      const { error } = await supabase
        .from('barbers')
        .delete()
        .eq('id', deletingBarber.id);

      if (error) throw error;

      toast({
        title: 'Erfolg!',
        description: 'Der Barbier wurde gelöscht.',
      });

      setIsDeleteDialogOpen(false);
      setDeletingBarber(null);
      fetchBarbers();
    } catch (error: any) {
      toast({
        title: 'Fehler',
        description: error.message || 'Der Barbier konnte nicht gelöscht werden.',
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

    const oldIndex = barbers.findIndex((b) => b.id === active.id);
    const newIndex = barbers.findIndex((b) => b.id === over.id);

    if (oldIndex === -1 || newIndex === -1) {
      return;
    }

    const newBarbers = arrayMove(barbers, oldIndex, newIndex);
    setBarbers(newBarbers);

    // Update display_order in database
    try {
      const updates = newBarbers.map((barber, index) => ({
        id: barber.id,
        display_order: index,
      }));

      // Update all barbers in a batch
      for (const update of updates) {
        const updateData: { display_order: number } = {
          display_order: update.display_order,
        };
        const { error } = await supabase
          .from('barbers')
          .update(updateData as any)
          .eq('id', update.id);

        if (error) throw error;
      }

      toast({
        title: 'Erfolg!',
        description: 'Die Reihenfolge wurde aktualisiert.',
      });
    } catch (error: any) {
      // Revert on error
      setBarbers(barbers);
      toast({
        title: 'Fehler',
        description: error.message || 'Die Reihenfolge konnte nicht aktualisiert werden.',
        variant: 'destructive',
      });
    }
  };

  // Sortable Barber Card Component
  const SortableBarberCard = ({ barber }: { barber: Barber }) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id: barber.id });

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
            <div className="w-16 h-16 rounded-full overflow-hidden bg-primary flex items-center justify-center">
              {barber.photo_url ? (
                <img
                  src={barber.photo_url}
                  alt={barber.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-8 h-8 text-primary-foreground" />
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleOpenDialog(barber)}
              className="h-8 w-8"
            >
              <Edit className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleDeleteClick(barber)}
              className="h-8 w-8 text-destructive hover:text-destructive"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <h3 className="font-display text-xl font-semibold text-foreground">
          {barber.name}
        </h3>
      </div>
    );
  };

  return (
    <div id="barbeiros" className="scroll-mt-24">
      <div className="text-center mb-12">
        <p className="text-muted-foreground font-body text-sm tracking-[0.2em] uppercase mb-4">
          Barbers Management
        </p>
        <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
          Barbiere verwalten
        </h2>
        <div className="w-20 h-1 bg-foreground mx-auto" />
      </div>

      <div className="mb-6 flex justify-center">
        <Button onClick={() => handleOpenDialog()} className="btn-primary">
          <Plus className="w-4 h-4 mr-2" />
          Neuer Barbier
        </Button>
      </div>

      {loading ? (
        <div className="text-center text-muted-foreground py-12">Lädt...</div>
      ) : barbers.length === 0 ? (
        <div className="text-center text-muted-foreground py-12">
          Keine Barbiere vorhanden.
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={barbers.map((b) => b.id)}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {barbers.map((barber) => (
                <SortableBarberCard key={barber.id} barber={barber} />
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
              <div className="w-full max-w-2xl bg-card border border-border rounded-2xl shadow-lg overflow-hidden">
                <div className="px-6 py-4 border-b border-border flex items-center justify-between">
                  <div className="min-w-0">
                    <h3 className="font-display text-xl font-semibold">
                      {editingBarber ? 'Barbier bearbeiten' : 'Neuer Barbier'}
                    </h3>
                  </div>

                  <Button variant="ghost" size="icon" onClick={handleCloseDialog} title="Schließen">
                    <X className="w-5 h-5" />
                  </Button>
                </div>

                <div className="p-6 space-y-6">
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Name *</p>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="z.B. Marco"
                      className="text-base md:text-sm"
                    />
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Foto</p>
                    <div className="space-y-4">
                      {formData.photo_url ? (
                        <div className="relative">
                          <div className="w-32 h-32 rounded-full overflow-hidden bg-primary flex items-center justify-center mx-auto border-2 border-border">
                            <img
                              src={formData.photo_url}
                              alt="Preview"
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleRemovePhoto}
                            className="mt-3 w-full"
                          >
                            Foto entfernen
                          </Button>
                        </div>
                      ) : (
                        <div className="w-32 h-32 rounded-full overflow-hidden bg-primary flex items-center justify-center mx-auto border-2 border-border">
                          <ImageIcon className="w-12 h-12 text-primary-foreground" />
                        </div>
                      )}

                      <div>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleFileSelect}
                          className="hidden"
                          id="photo-upload"
                        />
                        <Button
                          variant="outline"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploadingPhoto}
                          className="w-full"
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          {uploadingPhoto ? 'Hochladen...' : formData.photo_url ? 'Foto ändern' : 'Foto hochladen'}
                        </Button>
                        <p className="text-xs text-muted-foreground mt-2 text-center">
                          Max. 5MB, JPG, PNG ou WEBP
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-6 border-t border-border flex flex-col sm:flex-row gap-3 justify-end">
                  <Button variant="outline" onClick={handleCloseDialog}>
                    Abbrechen
                  </Button>
                  <Button onClick={handleSave} className="btn-primary w-full sm:w-auto">
                    {editingBarber ? 'Speichern' : 'Erstellen'}
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
            <AlertDialogTitle>Barbier löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Möchten Sie "{deletingBarber?.name}" wirklich löschen? Diese Aktion kann nicht
              rückgängig gemacht werden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeletingBarber(null)}>
              Abbrechen
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default BarbersSection;
