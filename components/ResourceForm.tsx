"use client";

import React, { useState, useCallback } from 'react';
import { Upload, X, Camera, FileText, Euro, Tag, Package, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

import { 
  CreateResourceFormData, 
  ResourceFormErrors, 
  ResourceType, 
  FrameworkType, 
  ResourceCategory,
  ImageUploadProgress 
} from '@/lib/types';
import { 
  validateResourceForm, 
  sanitizeFormData, 
  hasFormErrors,
  VALIDATION_RULES 
} from '@/lib/resourceValidation';
import { 
  uploadMultipleImages, 
  uploadResourceFile, 
  createImageThumbnail,
  formatFileSize 
} from '@/lib/uploadUtils';
import { toast } from '@/hooks/useToast';

interface ResourceFormProps {
  onSubmit?: (data: CreateResourceFormData) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
  initialData?: Partial<CreateResourceFormData>;
  mode?: 'create' | 'edit';
}

export default function ResourceForm({ 
  onSubmit, 
  onCancel, 
  isLoading = false,
  initialData,
  mode = 'create'
}: ResourceFormProps) {
  // État du formulaire
  const [formData, setFormData] = useState<CreateResourceFormData>({
    title: initialData?.title || '',
    description: initialData?.description || '',
    price: initialData?.price || 0,
    resource_type: initialData?.resource_type || 'non_escrow',
    framework: initialData?.framework,
    category: initialData?.category,
    images: [],
    resourceFile: undefined,
    escrowInfo: initialData?.escrowInfo || {
      requires_cfx_id: true,
      requires_email: true,
      requires_username: true,
      delivery_instructions: ''
    }
  });

  const [errors, setErrors] = useState<ResourceFormErrors>({});
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [uploadProgress, setUploadProgress] = useState<ImageUploadProgress[]>([]);
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Gestion des images
  const handleImageUpload = useCallback(async (files: FileList) => {
    const newFiles = Array.from(files);
    
    // Validation du nombre total d'images
    if (formData.images.length + newFiles.length > VALIDATION_RULES.images.maxFiles) {
      toast({
        title: 'Trop d\'images',
        description: `Vous ne pouvez uploader que ${VALIDATION_RULES.images.maxFiles} images maximum`,
        variant: 'destructive'
      });
      return;
    }

    // Créer les aperçus
    const newPreviews: string[] = [];
    for (const file of newFiles) {
      try {
        const preview = await createImageThumbnail(file);
        newPreviews.push(preview);
      } catch (error) {
        console.error('Erreur création aperçu:', error);
        newPreviews.push('');
      }
    }

    setFormData(prev => ({
      ...prev,
      images: [...prev.images, ...newFiles]
    }));
    
    setImagePreviews(prev => [...prev, ...newPreviews]);
  }, [formData.images.length]);

  const removeImage = useCallback((index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
    
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  }, []);

  // Gestion du fichier de ressource
  const handleResourceFileUpload = useCallback((file: File) => {
    setFormData(prev => ({
      ...prev,
      resourceFile: file
    }));
  }, []);

  // Validation en temps réel
  const validateField = useCallback((field: keyof CreateResourceFormData, value: any) => {
    const tempData = { ...formData, [field]: value };
    const fieldErrors = validateResourceForm(tempData);
    
    setErrors(prev => ({
      ...prev,
      [field]: fieldErrors[field]
    }));
  }, [formData]);

  // Gestion de la soumission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting || isLoading) return;
    
    // Validation complète
    const validationErrors = validateResourceForm(formData);
    setErrors(validationErrors);
    
    if (hasFormErrors(validationErrors)) {
      toast({
        title: 'Erreurs dans le formulaire',
        description: 'Veuillez corriger les erreurs avant de continuer',
        variant: 'destructive'
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const cleanData = sanitizeFormData(formData);
      
      if (onSubmit) {
        await onSubmit(cleanData);
        toast({
          title: 'Ressource créée',
          description: 'Votre ressource a été créée avec succès',
          variant: 'success'
        });
      }
    } catch (error) {
      console.error('Erreur soumission:', error);
      toast({
        title: 'Erreur',
        description: 'Une erreur est survenue lors de la création de la ressource',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const progress = Math.round((currentStep / 3) * 100);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* En-tête avec progression */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Ajouter un produit</h1>
            <p className="text-zinc-400">Partagez votre produit avec la communauté FiveM</p>
          </div>
          <Badge variant="outline" className="bg-[#FF7101]/10 text-[#FF7101] border-[#FF7101]/20">
            Étape {currentStep}/3
          </Badge>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-zinc-400">
            <span>Progression</span>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} className="h-2 bg-zinc-800" />
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Tabs value={currentStep.toString()} className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-zinc-800 border border-zinc-700">
            <TabsTrigger 
              value="1" 
              onClick={() => setCurrentStep(1)}
              className="data-[state=active]:bg-[#FF7101] data-[state=active]:text-white"
            >
              <Package className="w-4 h-4 mr-2" />
              Informations
            </TabsTrigger>
            <TabsTrigger 
              value="2" 
              onClick={() => setCurrentStep(2)}
              className="data-[state=active]:bg-[#FF7101] data-[state=active]:text-white"
            >
              <Camera className="w-4 h-4 mr-2" />
              Médias
            </TabsTrigger>
            <TabsTrigger 
              value="3" 
              onClick={() => setCurrentStep(3)}
              className="data-[state=active]:bg-[#FF7101] data-[state=active]:text-white"
            >
              <FileText className="w-4 h-4 mr-2" />
              Configuration
            </TabsTrigger>
          </TabsList>

          {/* Étape 1: Informations de base */}
          <TabsContent value="1" className="space-y-6 mt-6">
            <Card className="bg-zinc-800/50 border-zinc-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Package className="w-5 h-5 mr-2 text-[#FF7101]" />
                  Informations du produit
                </CardTitle>
                <CardDescription>
                  Décrivez votre ressource pour attirer les acheteurs
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Titre */}
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-white">
                    Titre de la ressource *
                  </Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => {
                      const value = e.target.value;
                      setFormData(prev => ({ ...prev, title: value }));
                      validateField('title', value);
                    }}
                    placeholder="Ex: Système de police avancé"
                    maxLength={VALIDATION_RULES.title.maxLength}
                    className="bg-zinc-900/60 border-zinc-700 text-zinc-100 placeholder:text-zinc-500 focus-visible:ring-[#FF7101]"
                  />
                  {errors.title && (
                    <Alert variant="destructive" className="bg-red-900/20 border-red-900/30">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{errors.title}</AlertDescription>
                    </Alert>
                  )}
                  <div className="text-xs text-zinc-500 text-right">
                    {formData.title.length}/{VALIDATION_RULES.title.maxLength}
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-white">
                    Description détaillée *
                  </Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => {
                      const value = e.target.value;
                      setFormData(prev => ({ ...prev, description: value }));
                      validateField('description', value);
                    }}
                    placeholder="Décrivez votre ressource en détail: fonctionnalités, installation, prérequis..."
                    rows={6}
                    maxLength={VALIDATION_RULES.description.maxLength}
                    className="bg-zinc-900/60 border-zinc-700 text-zinc-100 placeholder:text-zinc-500 focus-visible:ring-[#FF7101] resize-none"
                  />
                  {errors.description && (
                    <Alert variant="destructive" className="bg-red-900/20 border-red-900/30">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{errors.description}</AlertDescription>
                    </Alert>
                  )}
                  <div className="text-xs text-zinc-500 text-right">
                    {formData.description.length}/{VALIDATION_RULES.description.maxLength} (min: {VALIDATION_RULES.description.minLength})
                  </div>
                </div>

                {/* Prix */}
                <div className="space-y-2">
                  <Label htmlFor="price" className="text-white">
                    Prix en euros *
                  </Label>
                  <div className="relative">
                    <Euro className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-500 h-4 w-4" />
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      min="0.01"
                      max={VALIDATION_RULES.price.max}
                      value={formData.price || ''}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value) || 0;
                        setFormData(prev => ({ ...prev, price: value }));
                        validateField('price', value);
                      }}
                      placeholder="19.99"
                      className="pl-10 bg-zinc-900/60 border-zinc-700 text-zinc-100 placeholder:text-zinc-500 focus-visible:ring-[#FF7101]"
                    />
                  </div>
                  {errors.price && (
                    <Alert variant="destructive" className="bg-red-900/20 border-red-900/30">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{errors.price}</AlertDescription>
                    </Alert>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Framework */}
                  <div className="space-y-2">
                    <Label className="text-white">Framework (optionnel)</Label>
                    <Select
                      value={formData.framework || ''}
                      onValueChange={(value) => 
                        setFormData(prev => ({ 
                          ...prev, 
                          framework: value as FrameworkType || undefined 
                        }))
                      }
                    >
                      <SelectTrigger className="bg-zinc-900/60 border-zinc-700 text-zinc-100">
                        <SelectValue placeholder="Sélectionner un framework" />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-800 border-zinc-700">
                        <SelectItem value="ESX">ESX</SelectItem>
                        <SelectItem value="QBCore">QBCore</SelectItem>
                        <SelectItem value="Standalone">Standalone</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Catégorie */}
                  <div className="space-y-2">
                    <Label className="text-white">Catégorie (optionnel)</Label>
                    <Select
                      value={formData.category || ''}
                      onValueChange={(value) => 
                        setFormData(prev => ({ 
                          ...prev, 
                          category: value as ResourceCategory || undefined 
                        }))
                      }
                    >
                      <SelectTrigger className="bg-zinc-900/60 border-zinc-700 text-zinc-100">
                        <SelectValue placeholder="Sélectionner une catégorie" />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-800 border-zinc-700">
                        <SelectItem value="Police">Police</SelectItem>
                        <SelectItem value="Civilian">Civilian</SelectItem>
                        <SelectItem value="UI">UI</SelectItem>
                        <SelectItem value="Jobs">Jobs</SelectItem>
                        <SelectItem value="Vehicles">Vehicles</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button 
                    type="button" 
                    onClick={() => setCurrentStep(2)}
                    className="bg-[#FF7101] hover:bg-[#FF7101]/90 text-white"
                  >
                    Suivant: Médias
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Étape 2: Upload des médias */}
          <TabsContent value="2" className="space-y-6 mt-6">
            <Card className="bg-zinc-800/50 border-zinc-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Camera className="w-5 h-5 mr-2 text-[#FF7101]" />
                  Images du produit
                </CardTitle>
                <CardDescription>
                  Ajoutez des images attractives pour présenter votre produit (au moins 1 requise)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Zone d'upload d'images */}
                <div className="space-y-4">
                  <div
                    className="border-2 border-dashed border-zinc-600 rounded-lg p-8 text-center hover:border-[#FF7101]/50 transition-colors cursor-pointer"
                    onClick={() => document.getElementById('image-upload')?.click()}
                  >
                    <Upload className="w-12 h-12 text-zinc-500 mx-auto mb-4" />
                    <p className="text-zinc-300 mb-2">Cliquez pour ajouter des images</p>
                    <p className="text-sm text-zinc-500">
                      JPG, PNG uniquement • Max {VALIDATION_RULES.images.maxFiles} images • 5 MB par image
                    </p>
                  </div>
                  
                  <input
                    id="image-upload"
                    type="file"
                    accept={VALIDATION_RULES.images.allowedExtensions.join(',')}
                    multiple
                    onChange={(e) => e.target.files && handleImageUpload(e.target.files)}
                    className="hidden"
                  />

                  {errors.images && (
                    <Alert variant="destructive" className="bg-red-900/20 border-red-900/30">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{errors.images}</AlertDescription>
                    </Alert>
                  )}

                  {/* Aperçu des images */}
                  {imagePreviews.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {imagePreviews.map((preview, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={preview}
                            alt={`Aperçu ${index + 1}`}
                            className="w-full h-32 object-cover rounded-lg border border-zinc-700"
                          />
                          <Button
                            type="button"
                            size="sm"
                            variant="destructive"
                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 h-auto"
                            onClick={() => removeImage(index)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                          {index === 0 && (
                            <Badge 
                              className="absolute bottom-2 left-2 bg-[#FF7101] text-white"
                            >
                              Miniature
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex justify-between">
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => setCurrentStep(1)}
                    className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                  >
                    Précédent
                  </Button>
                  <Button 
                    type="button" 
                    onClick={() => setCurrentStep(3)}
                    className="bg-[#FF7101] hover:bg-[#FF7101]/90 text-white"
                  >
                    Suivant: Configuration
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Étape 3: Configuration */}
          <TabsContent value="3" className="space-y-6 mt-6">
            <Card className="bg-zinc-800/50 border-zinc-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <FileText className="w-5 h-5 mr-2 text-[#FF7101]" />
                  Type de produit
                </CardTitle>
                <CardDescription>
                  Choisissez comment vous souhaitez livrer votre ressource
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Type de ressource */}
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card 
                      className={`cursor-pointer border-2 transition-all ${
                        formData.resource_type === 'non_escrow' 
                          ? 'border-[#FF7101] bg-[#FF7101]/10' 
                          : 'border-zinc-700 hover:border-zinc-600'
                      }`}
                      onClick={() => setFormData(prev => ({ ...prev, resource_type: 'non_escrow' }))}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-3">
                          <div className={`w-4 h-4 rounded-full border-2 ${
                            formData.resource_type === 'non_escrow' 
                              ? 'border-[#FF7101] bg-[#FF7101]' 
                              : 'border-zinc-600'
                          }`} />
                          <div>
                            <h3 className="font-semibold text-white">Non Escrow</h3>
                            <p className="text-sm text-zinc-400">Téléchargement direct du fichier ZIP</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card 
                      className={`cursor-pointer border-2 transition-all ${
                        formData.resource_type === 'escrow' 
                          ? 'border-[#FF7101] bg-[#FF7101]/10' 
                          : 'border-zinc-700 hover:border-zinc-600'
                      }`}
                      onClick={() => setFormData(prev => ({ ...prev, resource_type: 'escrow' }))}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-3">
                          <div className={`w-4 h-4 rounded-full border-2 ${
                            formData.resource_type === 'escrow' 
                              ? 'border-[#FF7101] bg-[#FF7101]' 
                              : 'border-zinc-600'
                          }`} />
                          <div>
                            <h3 className="font-semibold text-white">Escrow</h3>
                            <p className="text-sm text-zinc-400">Livraison via Tebex après paiement</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                {/* Configuration pour non-escrow */}
                {formData.resource_type === 'non_escrow' && (
                  <Card className="bg-zinc-900/50 border-zinc-700">
                    <CardHeader>
                      <CardTitle className="text-lg text-white">Fichier du produit</CardTitle>
                      <CardDescription>
                        Uploadez le fichier ZIP contenant votre ressource
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div
                        className="border-2 border-dashed border-zinc-600 rounded-lg p-6 text-center hover:border-[#FF7101]/50 transition-colors cursor-pointer"
                        onClick={() => document.getElementById('resource-file-upload')?.click()}
                      >
                        <FileText className="w-10 h-10 text-zinc-500 mx-auto mb-3" />
                        {formData.resourceFile ? (
                          <div>
                            <p className="text-zinc-300 mb-1">{formData.resourceFile.name}</p>
                            <p className="text-sm text-zinc-500">
                              {formatFileSize(formData.resourceFile.size)}
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p className="text-zinc-300 mb-2">Cliquez pour ajouter votre fichier ZIP</p>
                            <p className="text-sm text-zinc-500">
                              Fichier ZIP uniquement • Max 50 MB
                            </p>
                          </div>
                        )}
                      </div>
                      
                      <input
                        id="resource-file-upload"
                        type="file"
                        accept=".zip"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleResourceFileUpload(file);
                        }}
                        className="hidden"
                      />

                      {errors.resourceFile && (
                        <Alert variant="destructive" className="bg-red-900/20 border-red-900/30">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>{errors.resourceFile}</AlertDescription>
                        </Alert>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Configuration pour escrow */}
                {formData.resource_type === 'escrow' && formData.escrowInfo && (
                  <Card className="bg-zinc-900/50 border-zinc-700">
                    <CardHeader>
                      <CardTitle className="text-lg text-white">Configuration Escrow</CardTitle>
                      <CardDescription>
                        Définissez les informations requises de la part de l'acheteur
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label className="text-white">ID CFX requis</Label>
                          <Switch
                            checked={formData.escrowInfo.requires_cfx_id}
                            onCheckedChange={(checked) =>
                              setFormData(prev => ({
                                ...prev,
                                escrowInfo: prev.escrowInfo ? {
                                  ...prev.escrowInfo,
                                  requires_cfx_id: checked
                                } : undefined
                              }))
                            }
                          />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <Label className="text-white">Email requis</Label>
                          <Switch
                            checked={formData.escrowInfo.requires_email}
                            onCheckedChange={(checked) =>
                              setFormData(prev => ({
                                ...prev,
                                escrowInfo: prev.escrowInfo ? {
                                  ...prev.escrowInfo,
                                  requires_email: checked
                                } : undefined
                              }))
                            }
                          />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <Label className="text-white">Nom d'utilisateur requis</Label>
                          <Switch
                            checked={formData.escrowInfo.requires_username}
                            onCheckedChange={(checked) =>
                              setFormData(prev => ({
                                ...prev,
                                escrowInfo: prev.escrowInfo ? {
                                  ...prev.escrowInfo,
                                  requires_username: checked
                                } : undefined
                              }))
                            }
                          />
                        </div>
                      </div>

                      <Separator className="bg-zinc-700" />

                      <div className="space-y-2">
                        <Label className="text-white">Instructions de livraison (optionnel)</Label>
                        <Textarea
                          value={formData.escrowInfo.delivery_instructions || ''}
                          onChange={(e) =>
                            setFormData(prev => ({
                              ...prev,
                              escrowInfo: prev.escrowInfo ? {
                                ...prev.escrowInfo,
                                delivery_instructions: e.target.value
                              } : undefined
                            }))
                          }
                          placeholder="Instructions spéciales pour la livraison de votre ressource..."
                          rows={3}
                          maxLength={1000}
                          className="bg-zinc-800/60 border-zinc-700 text-zinc-100 placeholder:text-zinc-500 focus-visible:ring-[#FF7101] resize-none"
                        />
                        <div className="text-xs text-zinc-500 text-right">
                          {(formData.escrowInfo.delivery_instructions || '').length}/1000
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <div className="flex justify-between">
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => setCurrentStep(2)}
                    className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                  >
                    Précédent
                  </Button>
                  
                  <div className="flex space-x-3">
                    {onCancel && (
                      <Button 
                        type="button" 
                        variant="outline"
                        onClick={onCancel}
                        className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                      >
                        Annuler
                      </Button>
                    )}
                    
                    <Button 
                      type="submit"
                      disabled={isSubmitting || isLoading}
                      className="bg-[#FF7101] hover:bg-[#FF7101]/90 text-white"
                    >
                      {(isSubmitting || isLoading) ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Création...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4 mr-2" />
                          Créer le produit
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </form>
    </div>
  );
}
