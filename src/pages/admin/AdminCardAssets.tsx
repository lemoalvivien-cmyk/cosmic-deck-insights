import { useState, useCallback } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { useTarotCards } from '@/hooks/useTarotCards';
import { toast } from 'sonner';
import { 
  Upload, 
  Image as ImageIcon, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  RefreshCw,
  Loader2,
  ArrowLeft
} from 'lucide-react';
import { Link } from 'react-router-dom';

const BUCKET_NAME = 'tarot-cards';

interface UploadResult {
  filename: string;
  cardId: string;
  status: 'success' | 'error' | 'unknown';
  message: string;
}

export default function AdminCardAssets() {
  const { data: cards, isLoading: cardsLoading, refetch: refetchCards } = useTarotCards();
  
  // Back upload state
  const [backUploading, setBackUploading] = useState(false);
  const [backUrl, setBackUrl] = useState<string | null>(null);
  
  // Face upload state
  const [faceUploading, setFaceUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResults, setUploadResults] = useState<UploadResult[]>([]);
  
  // Mapping state
  const [mapping, setMapping] = useState(false);

  // Check for existing back on mount
  useState(() => {
    checkBackExists();
  });

  async function checkBackExists() {
    try {
      const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl('backs/default.webp');
      if (data?.publicUrl) {
        // Try to fetch to verify it exists
        const response = await fetch(data.publicUrl, { method: 'HEAD' });
        if (response.ok) {
          setBackUrl(data.publicUrl);
        }
      }
    } catch {
      // Ignore
    }
  }

  // Handle back upload
  const handleBackUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setBackUploading(true);
    
    try {
      // Upload to backs/default.webp (upsert)
      const { error } = await supabase.storage
        .from(BUCKET_NAME)
        .upload('backs/default.webp', file, {
          upsert: true,
          contentType: file.type,
        });

      if (error) throw error;

      const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl('backs/default.webp');
      setBackUrl(data.publicUrl + '?t=' + Date.now()); // Cache bust
      toast.success('Dos de carte uploadé avec succès');
    } catch (error) {
      console.error('Back upload error:', error);
      toast.error('Erreur lors de l\'upload du dos de carte');
    } finally {
      setBackUploading(false);
      event.target.value = '';
    }
  }, []);

  // Handle face uploads
  const handleFaceUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    if (!cards || cards.length === 0) {
      toast.error('Les cartes ne sont pas encore chargées');
      return;
    }

    setFaceUploading(true);
    setUploadProgress(0);
    setUploadResults([]);

    const results: UploadResult[] = [];
    const validCardIds = new Set(cards.map(c => c.id));

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const filename = file.name;
      
      // Extract card_id from filename (remove extension)
      const cardId = filename.replace(/\.(webp|png|jpg|jpeg)$/i, '');
      const ext = filename.split('.').pop()?.toLowerCase() || 'webp';
      
      // Check if card_id is valid
      if (!validCardIds.has(cardId)) {
        results.push({
          filename,
          cardId,
          status: 'unknown',
          message: 'ID de carte non reconnu',
        });
        setUploadProgress(Math.round(((i + 1) / files.length) * 100));
        continue;
      }

      try {
        // Upload to cards/<card_id>.<ext>
        const storagePath = `cards/${cardId}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from(BUCKET_NAME)
          .upload(storagePath, file, {
            upsert: true,
            contentType: file.type,
          });

        if (uploadError) throw uploadError;

        // Update database with image_url (path only, not full URL)
        const { error: dbError } = await supabase
          .from('tarot_cards')
          .update({ image_url: storagePath })
          .eq('id', cardId);

        if (dbError) throw dbError;

        results.push({
          filename,
          cardId,
          status: 'success',
          message: 'Uploadé et mappé',
        });
      } catch (error) {
        console.error(`Upload error for ${filename}:`, error);
        results.push({
          filename,
          cardId,
          status: 'error',
          message: error instanceof Error ? error.message : 'Erreur inconnue',
        });
      }

      setUploadProgress(Math.round(((i + 1) / files.length) * 100));
    }

    setUploadResults(results);
    setFaceUploading(false);
    
    // Refetch cards to update image_url data
    await refetchCards();
    
    const successCount = results.filter(r => r.status === 'success').length;
    const errorCount = results.filter(r => r.status === 'error').length;
    const unknownCount = results.filter(r => r.status === 'unknown').length;
    
    if (successCount > 0) {
      toast.success(`${successCount} image(s) uploadée(s) avec succès`);
    }
    if (errorCount > 0) {
      toast.error(`${errorCount} erreur(s) d'upload`);
    }
    if (unknownCount > 0) {
      toast.warning(`${unknownCount} fichier(s) avec ID non reconnu`);
    }

    event.target.value = '';
  }, [cards, refetchCards]);

  // Auto-map from storage
  const handleAutoMap = useCallback(async () => {
    if (!cards || cards.length === 0) {
      toast.error('Les cartes ne sont pas encore chargées');
      return;
    }

    setMapping(true);
    let mapped = 0;

    try {
      // Get list of files in cards/ folder
      const { data: files, error } = await supabase.storage
        .from(BUCKET_NAME)
        .list('cards');

      if (error) throw error;

      if (!files || files.length === 0) {
        toast.info('Aucun fichier trouvé dans le dossier cards/');
        return;
      }

      // For each card without image_url, check if file exists
      for (const card of cards) {
        if (card.image_url) continue; // Already has image

        // Check for matching file
        const matchingFile = files.find(f => {
          const fileId = f.name.replace(/\.(webp|png|jpg|jpeg)$/i, '');
          return fileId === card.id;
        });

        if (matchingFile) {
          const storagePath = `cards/${matchingFile.name}`;
          
          const { error: updateError } = await supabase
            .from('tarot_cards')
            .update({ image_url: storagePath })
            .eq('id', card.id);

          if (!updateError) {
            mapped++;
          }
        }
      }

      await refetchCards();

      if (mapped > 0) {
        toast.success(`${mapped} carte(s) mappée(s) automatiquement`);
      } else {
        toast.info('Aucune nouvelle carte à mapper');
      }
    } catch (error) {
      console.error('Auto-map error:', error);
      toast.error('Erreur lors du mapping automatique');
    } finally {
      setMapping(false);
    }
  }, [cards, refetchCards]);

  // Stats
  const totalCards = cards?.length || 0;
  const cardsWithImages = cards?.filter(c => c.image_url).length || 0;
  const cardsWithoutImages = totalCards - cardsWithImages;

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex items-center gap-4">
            <Link to="/admin">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-serif font-semibold">Gestion des Images</h1>
              <p className="text-muted-foreground">Upload et mapping des 78 cartes du tarot</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-3xl font-bold text-primary">{totalCards}</p>
                  <p className="text-sm text-muted-foreground">Cartes total</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-3xl font-bold text-green-500">{cardsWithImages}</p>
                  <p className="text-sm text-muted-foreground">Avec image</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-3xl font-bold text-amber-500">{cardsWithoutImages}</p>
                  <p className="text-sm text-muted-foreground">Sans image</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Back Upload */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5" />
                Dos de carte
              </CardTitle>
              <CardDescription>
                Upload d'une seule image pour le dos de toutes les cartes (backs/default.webp)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {backUrl && (
                <div className="flex items-center gap-4">
                  <img 
                    src={backUrl} 
                    alt="Dos de carte" 
                    className="w-24 h-36 object-cover rounded-lg border"
                  />
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <CheckCircle className="h-3 w-3 text-green-500" />
                    Dos uploadé
                  </Badge>
                </div>
              )}
              
              <div className="flex items-center gap-4">
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept="image/webp,image/png,image/jpeg"
                    onChange={handleBackUpload}
                    disabled={backUploading}
                    className="hidden"
                  />
                  <Button asChild disabled={backUploading}>
                    <span>
                      {backUploading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Upload...
                        </>
                      ) : (
                        <>
                          <Upload className="mr-2 h-4 w-4" />
                          {backUrl ? 'Remplacer le dos' : 'Uploader le dos'}
                        </>
                      )}
                    </span>
                  </Button>
                </label>
              </div>
            </CardContent>
          </Card>

          {/* Face Upload */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Upload des 78 faces
              </CardTitle>
              <CardDescription>
                Sélection multiple de fichiers. Convention : nom du fichier = ID de la carte.
                <br />
                Exemples : major_00.webp, minor_wands_ace.webp, minor_cups_10.webp
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Les fichiers doivent être nommés avec l'ID exact de la carte (ex: major_00, minor_wands_ace).
                  Extensions acceptées : .webp, .png, .jpg
                </AlertDescription>
              </Alert>

              <div className="flex items-center gap-4">
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept="image/webp,image/png,image/jpeg"
                    multiple
                    onChange={handleFaceUpload}
                    disabled={faceUploading || cardsLoading}
                    className="hidden"
                  />
                  <Button asChild disabled={faceUploading || cardsLoading}>
                    <span>
                      {faceUploading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Upload en cours...
                        </>
                      ) : (
                        <>
                          <Upload className="mr-2 h-4 w-4" />
                          Sélectionner les fichiers
                        </>
                      )}
                    </span>
                  </Button>
                </label>

                <Button 
                  variant="outline" 
                  onClick={handleAutoMap}
                  disabled={mapping || cardsLoading}
                >
                  {mapping ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Mapping...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Auto-map depuis Storage
                    </>
                  )}
                </Button>
              </div>

              {faceUploading && (
                <div className="space-y-2">
                  <Progress value={uploadProgress} />
                  <p className="text-sm text-muted-foreground text-center">{uploadProgress}%</p>
                </div>
              )}

              {/* Upload Results */}
              {uploadResults.length > 0 && (
                <div className="space-y-4">
                  <h3 className="font-medium">Résultats ({uploadResults.length} fichiers)</h3>
                  <div className="max-h-80 overflow-y-auto border rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Fichier</TableHead>
                          <TableHead>ID Carte</TableHead>
                          <TableHead>Statut</TableHead>
                          <TableHead>Message</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {uploadResults.map((result, idx) => (
                          <TableRow key={idx}>
                            <TableCell className="font-mono text-sm">{result.filename}</TableCell>
                            <TableCell className="font-mono text-sm">{result.cardId}</TableCell>
                            <TableCell>
                              {result.status === 'success' && (
                                <Badge variant="default" className="bg-green-500">
                                  <CheckCircle className="mr-1 h-3 w-3" />
                                  OK
                                </Badge>
                              )}
                              {result.status === 'error' && (
                                <Badge variant="destructive">
                                  <XCircle className="mr-1 h-3 w-3" />
                                  Erreur
                                </Badge>
                              )}
                              {result.status === 'unknown' && (
                                <Badge variant="secondary">
                                  <AlertTriangle className="mr-1 h-3 w-3" />
                                  Inconnu
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {result.message}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Cards Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Aperçu des cartes</CardTitle>
              <CardDescription>
                Liste des 78 cartes avec leur statut d'image
              </CardDescription>
            </CardHeader>
            <CardContent>
              {cardsLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <div className="max-h-96 overflow-y-auto border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Nom</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Image</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {cards?.map((card) => (
                        <TableRow key={card.id}>
                          <TableCell className="font-mono text-sm">{card.id}</TableCell>
                          <TableCell>{card.nom_fr}</TableCell>
                          <TableCell>
                            <Badge variant={card.type === 'major' ? 'default' : 'secondary'}>
                              {card.type === 'major' ? 'Majeur' : 'Mineur'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {card.image_url ? (
                              <Badge variant="default" className="bg-green-500">
                                <CheckCircle className="mr-1 h-3 w-3" />
                                OK
                              </Badge>
                            ) : (
                              <Badge variant="secondary">
                                <XCircle className="mr-1 h-3 w-3" />
                                Manquante
                              </Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
