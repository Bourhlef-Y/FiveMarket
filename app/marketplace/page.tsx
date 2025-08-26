"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Resource, ResourceType } from '@/lib/types';
import { supabase } from '@/lib/supabaseClient';
import { Search, Filter, X, ChevronDown, ChevronUp } from 'lucide-react';
import ResourceCard from '@/components/ResourceCard';

export default function MarketplacePage() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [authors, setAuthors] = useState<{id: string, username: string}[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  
  // États des filtres
  const [searchQuery, setSearchQuery] = useState('');
  // Filtres temporaires (non appliqués)
  const [tempFramework, setTempFramework] = useState<string>('all');
  const [tempCategory, setTempCategory] = useState<string>('all');
  const [tempResourceType, setTempResourceType] = useState<string>('all');
  const [tempDateFilter, setTempDateFilter] = useState<string>('all');
  const [tempPopularityFilter, setTempPopularityFilter] = useState<string>('all');
  const [tempPriceRange, setTempPriceRange] = useState<[number]>([100]);
  const [tempFreeOnly, setTempFreeOnly] = useState(false);
  
  // Filtres appliqués (utilisés pour la requête)
  const [appliedFramework, setAppliedFramework] = useState<string>('all');
  const [appliedCategory, setAppliedCategory] = useState<string>('all');
  const [appliedResourceType, setAppliedResourceType] = useState<string>('all');
  const [appliedDateFilter, setAppliedDateFilter] = useState<string>('all');
  const [appliedPopularityFilter, setAppliedPopularityFilter] = useState<string>('all');
  const [appliedPriceRange, setAppliedPriceRange] = useState<[number]>([100]);
  const [appliedFreeOnly, setAppliedFreeOnly] = useState(false);
  
  const [sortBy, setSortBy] = useState<string>('newest');

  useEffect(() => {
    fetchResources();
    fetchAuthors();
  }, [appliedFramework, appliedCategory, appliedResourceType, appliedDateFilter, appliedPopularityFilter, appliedPriceRange, appliedFreeOnly, sortBy]);

  const fetchResources = async () => {
    setLoading(true);
    let query = supabase
      .from('resources')
      .select(`
        *,
        profiles:author_id (
          username,
          avatar_url
        )
      `)
      .eq('status', 'approved'); // Seulement les ressources approuvées

    // Appliquer les filtres
    if (appliedFramework !== 'all') {
      query = query.eq('framework', appliedFramework);
    }
    if (appliedCategory !== 'all') {
      query = query.eq('category', appliedCategory);
    }
    if (appliedResourceType !== 'all') {
      query = query.eq('resource_type', appliedResourceType);
    }

    // Filtre par prix
    if (appliedFreeOnly) {
      query = query.eq('price', 0);
    } else if (appliedPriceRange[0] < 100) {
      query = query.lte('price', appliedPriceRange[0]);
    }

    // Filtre par date
    if (appliedDateFilter !== 'all') {
      const now = new Date();
      let dateThreshold = new Date();
      
      switch (appliedDateFilter) {
        case 'week':
          dateThreshold.setDate(now.getDate() - 7);
          break;
        case 'month':
          dateThreshold.setMonth(now.getMonth() - 1);
          break;
        case '3months':
          dateThreshold.setMonth(now.getMonth() - 3);
          break;
      }
      
      if (appliedDateFilter !== 'older') {
        query = query.gte('created_at', dateThreshold.toISOString());
      } else {
        dateThreshold.setMonth(now.getMonth() - 3);
        query = query.lt('created_at', dateThreshold.toISOString());
      }
    }

    // Filtre par popularité
    if (appliedPopularityFilter !== 'all') {
      switch (appliedPopularityFilter) {
        case 'high':
          query = query.gte('download_count', 100);
          break;
        case 'medium':
          query = query.gte('download_count', 10).lt('download_count', 100);
          break;
        case 'new':
          query = query.lt('download_count', 10);
          break;
      }
    }

    // Appliquer le tri
    switch (sortBy) {
      case 'newest':
        query = query.order('created_at', { ascending: false });
        break;
      case 'oldest':
        query = query.order('created_at', { ascending: true });
        break;
      case 'price-low':
        query = query.order('price', { ascending: true });
        break;
      case 'price-high':
        query = query.order('price', { ascending: false });
        break;
      case 'popular':
        query = query.order('download_count', { ascending: false });
        break;
      case 'title':
        query = query.order('title', { ascending: true });
        break;
    }

    const { data, error } = await query;

    if (error) {
      console.error('Erreur lors de la récupération des ressources:', error);
      return;
    }

    setResources(data || []);
    setLoading(false);
  };

  const fetchAuthors = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, username')
      .not('username', 'is', null)
      .order('username');

    if (error) {
      console.error('Erreur lors de la récupération des auteurs:', error);
      return;
    }

    setAuthors(data || []);
  };

  const filteredResources = resources.filter(resource =>
    resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    resource.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const applyFilters = () => {
    setAppliedFramework(tempFramework);
    setAppliedCategory(tempCategory);
    setAppliedResourceType(tempResourceType);
    setAppliedDateFilter(tempDateFilter);
    setAppliedPopularityFilter(tempPopularityFilter);
    setAppliedPriceRange(tempPriceRange);
    setAppliedFreeOnly(tempFreeOnly);
    setShowFilters(false);
  };

  const clearAllFilters = () => {
    setSearchQuery('');
    setTempFramework('all');
    setTempCategory('all');
    setTempResourceType('all');
    setTempDateFilter('all');
    setTempPopularityFilter('all');
    setTempPriceRange([100]);
    setTempFreeOnly(false);
    setAppliedFramework('all');
    setAppliedCategory('all');
    setAppliedResourceType('all');
    setAppliedDateFilter('all');
    setAppliedPopularityFilter('all');
    setAppliedPriceRange([100]);
    setAppliedFreeOnly(false);
    setSortBy('newest');
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (searchQuery) count++;
    if (appliedFramework !== 'all') count++;
    if (appliedCategory !== 'all') count++;
    if (appliedResourceType !== 'all') count++;
    if (appliedDateFilter !== 'all') count++;
    if (appliedPopularityFilter !== 'all') count++;
    if (appliedPriceRange[0] < 100 || appliedFreeOnly) count++;
    return count;
  };

  const getTempFiltersCount = () => {
    let count = 0;
    if (tempFramework !== 'all') count++;
    if (tempCategory !== 'all') count++;
    if (tempResourceType !== 'all') count++;
    if (tempDateFilter !== 'all') count++;
    if (tempPopularityFilter !== 'all') count++;
    if (tempPriceRange[0] < 100 || tempFreeOnly) count++;
    return count;
  };

  return (
    <div className="min-h-screen bg-zinc-900 py-12">
      <div className="container mx-auto px-4">
        {/* En-tête */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">FiveM Marketplace</h1>
          <p className="text-zinc-400 max-w-2xl mx-auto">
            Découvrez une large sélection de scripts et ressources pour votre serveur FiveM
          </p>
        </div>

        {/* Barre de recherche et filtres */}
        <Card className="mb-8 bg-zinc-800/50 border-zinc-700">
          <CardContent className="p-6">
            <div className="flex flex-col gap-6">
              {/* Recherche */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                <Input
                  type="search"
                  placeholder="Rechercher des scripts, ressources..."
                  className="pl-10 bg-zinc-900 border-zinc-700 text-zinc-100"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* En-tête des filtres */}
              <div className="flex flex-col sm:flex-row justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowFilters(!showFilters)}
                    className="border-zinc-600 text-zinc-300"
                  >
                    <Filter className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">Filtres</span>
                    <span className="sm:hidden">Filtres</span>
                    {showFilters ? <ChevronUp className="h-4 w-4 ml-2" /> : <ChevronDown className="h-4 w-4 ml-2" />}
                    {getActiveFiltersCount() > 0 && (
                      <Badge variant="destructive" className="ml-2 h-5 w-5 p-0 text-xs">
                        {getActiveFiltersCount()}
                      </Badge>
                    )}
                  </Button>
                  
                  {getActiveFiltersCount() > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearAllFilters}
                      className="text-zinc-400 hover:text-zinc-200"
                    >
                      <X className="h-4 w-4 mr-1" />
                      <span className="hidden sm:inline">Effacer tout</span>
                      <span className="sm:hidden">Reset</span>
                    </Button>
                  )}
                </div>

                {/* Tri */}
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-full sm:w-[200px] bg-zinc-900 border-zinc-700 text-zinc-100">
                    <SelectValue placeholder="Trier par" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-800 border-zinc-700">
                    <SelectItem value="newest">Plus récents</SelectItem>
                    <SelectItem value="oldest">Plus anciens</SelectItem>
                    <SelectItem value="price-low">Prix croissant</SelectItem>
                    <SelectItem value="price-high">Prix décroissant</SelectItem>
                    <SelectItem value="popular">Populaires</SelectItem>
                    <SelectItem value="title">Alphabétique</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Filtres avancés - conditionnels */}
              {showFilters && (
                <div className="border-t border-zinc-700 pt-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    
                    {/* Framework */}
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium text-zinc-300">Framework</h4>
                      <Select value={tempFramework} onValueChange={setTempFramework}>
                        <SelectTrigger className="bg-zinc-900 border-zinc-700 text-zinc-100">
                          <SelectValue placeholder="Framework" />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-800 border-zinc-700">
                          <SelectItem value="all">Tous les frameworks</SelectItem>
                          <SelectItem value="ESX">ESX</SelectItem>
                          <SelectItem value="QBCore">QBCore</SelectItem>
                          <SelectItem value="Standalone">Standalone</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Catégorie */}
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium text-zinc-300">Catégorie</h4>
                      <Select value={tempCategory} onValueChange={setTempCategory}>
                        <SelectTrigger className="bg-zinc-900 border-zinc-700 text-zinc-100">
                          <SelectValue placeholder="Catégorie" />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-800 border-zinc-700">
                          <SelectItem value="all">Toutes les catégories</SelectItem>
                          <SelectItem value="Police">Police</SelectItem>
                          <SelectItem value="Civilian">Civil</SelectItem>
                          <SelectItem value="UI">Interface</SelectItem>
                          <SelectItem value="Jobs">Métiers</SelectItem>
                          <SelectItem value="Vehicles">Véhicules</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Type de ressource */}
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium text-zinc-300">Type</h4>
                      <Select value={tempResourceType} onValueChange={setTempResourceType}>
                        <SelectTrigger className="bg-zinc-900 border-zinc-700 text-zinc-100">
                          <SelectValue placeholder="Type de ressource" />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-800 border-zinc-700">
                          <SelectItem value="all">Tous les types</SelectItem>
                          <SelectItem value="escrow">Escrow</SelectItem>
                          <SelectItem value="non_escrow">Non-Escrow</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Date de sortie */}
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium text-zinc-300">Date de sortie</h4>
                      <Select value={tempDateFilter} onValueChange={setTempDateFilter}>
                        <SelectTrigger className="bg-zinc-900 border-zinc-700 text-zinc-100">
                          <SelectValue placeholder="Période" />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-800 border-zinc-700">
                          <SelectItem value="all">Toutes les dates</SelectItem>
                          <SelectItem value="week">Dernière semaine</SelectItem>
                          <SelectItem value="month">Dernier mois</SelectItem>
                          <SelectItem value="3months">3 derniers mois</SelectItem>
                          <SelectItem value="older">Plus ancien</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Popularité */}
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium text-zinc-300">Popularité</h4>
                      <Select value={tempPopularityFilter} onValueChange={setTempPopularityFilter}>
                        <SelectTrigger className="bg-zinc-900 border-zinc-700 text-zinc-100">
                          <SelectValue placeholder="Téléchargements" />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-800 border-zinc-700">
                          <SelectItem value="all">Tous</SelectItem>
                          <SelectItem value="high">Populaires (100+)</SelectItem>
                          <SelectItem value="medium">Moyens (10-100)</SelectItem>
                          <SelectItem value="new">Nouveautés (&lt;10)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Filtre Prix */}
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium text-zinc-300">Prix</h4>
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="free-only"
                            checked={tempFreeOnly}
                            onCheckedChange={setTempFreeOnly}
                          />
                          <label htmlFor="free-only" className="text-sm text-zinc-400">
                            Gratuit uniquement
                          </label>
                        </div>
                        
                        {!tempFreeOnly && (
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm text-zinc-400">
                              <span>Maximum</span>
                              <span>{tempPriceRange[0]}€</span>
                            </div>
                            <Slider
                              value={tempPriceRange}
                              onValueChange={setTempPriceRange}
                              max={100}
                              min={0}
                              step={5}
                              className="w-full"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Boutons d'action */}
                  <div className="flex justify-between items-center pt-4 border-t border-zinc-700">
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-zinc-400">
                        {getTempFiltersCount() > 0 ? `${getTempFiltersCount()} filtre(s) sélectionné(s)` : 'Aucun filtre sélectionné'}
                      </span>
                    </div>
                    
                    <div className="flex gap-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setTempFramework('all');
                          setTempCategory('all');
                          setTempResourceType('all');
                          setTempDateFilter('all');
                          setTempPopularityFilter('all');
                          setTempPriceRange([100]);
                          setTempFreeOnly(false);
                        }}
                        className="border-zinc-600 text-zinc-400"
                        disabled={getTempFiltersCount() === 0}
                      >
                        Réinitialiser
                      </Button>
                      
                      <Button
                        onClick={applyFilters}
                        className="bg-[#FF7101] hover:bg-[#FF7101]/90 text-white"
                      >
                        Appliquer les filtres
                      </Button>
                    </div>
                  </div>

                  {/* Résumé des filtres actifs appliqués */}
                  {getActiveFiltersCount() > 0 && (
                    <div className="flex flex-wrap gap-2 pt-4 border-t border-zinc-700">
                      <span className="text-sm text-zinc-400">Filtres appliqués:</span>
                      {searchQuery && (
                        <Badge variant="secondary" className="bg-zinc-700 text-zinc-300">
                          Recherche: "{searchQuery}"
                        </Badge>
                      )}
                      {appliedFramework !== 'all' && (
                        <Badge variant="secondary" className="bg-zinc-700 text-zinc-300">
                          Framework: {appliedFramework}
                        </Badge>
                      )}
                      {appliedCategory !== 'all' && (
                        <Badge variant="secondary" className="bg-zinc-700 text-zinc-300">
                          Catégorie: {appliedCategory}
                        </Badge>
                      )}
                      {appliedResourceType !== 'all' && (
                        <Badge variant="secondary" className="bg-zinc-700 text-zinc-300">
                          Type: {appliedResourceType === 'escrow' ? 'Escrow' : 'Non-Escrow'}
                        </Badge>
                      )}
                      {appliedFreeOnly && (
                        <Badge variant="secondary" className="bg-zinc-700 text-zinc-300">
                          Gratuit uniquement
                        </Badge>
                      )}
                      {!appliedFreeOnly && appliedPriceRange[0] < 100 && (
                        <Badge variant="secondary" className="bg-zinc-700 text-zinc-300">
                          Prix ≤ {appliedPriceRange[0]}€
                        </Badge>
                      )}
                      {appliedDateFilter !== 'all' && (
                        <Badge variant="secondary" className="bg-zinc-700 text-zinc-300">
                          Date: {appliedDateFilter === 'week' ? 'Dernière semaine' : 
                                 appliedDateFilter === 'month' ? 'Dernier mois' : 
                                 appliedDateFilter === '3months' ? '3 derniers mois' : 'Plus ancien'}
                        </Badge>
                      )}
                      {appliedPopularityFilter !== 'all' && (
                        <Badge variant="secondary" className="bg-zinc-700 text-zinc-300">
                          Popularité: {appliedPopularityFilter === 'high' ? 'Élevée' :
                                      appliedPopularityFilter === 'medium' ? 'Moyenne' : 'Nouveauté'}
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Statistiques des résultats */}
        {!loading && (
          <div className="mb-6 flex justify-between items-center">
            <p className="text-zinc-400">
              {filteredResources.length} ressource{filteredResources.length > 1 ? 's' : ''} trouvée{filteredResources.length > 1 ? 's' : ''}
              {getActiveFiltersCount() > 0 && ' avec les filtres appliqués'}
            </p>
            <p className="text-sm text-zinc-500">
              Total: {resources.length} ressource{resources.length > 1 ? 's' : ''} disponible{resources.length > 1 ? 's' : ''}
            </p>
          </div>
        )}

        {/* Grille de ressources */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-[#FF7101]"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredResources.length > 0 ? (
              filteredResources.map((resource) => (
                <ResourceCard key={resource.id} resource={resource} />
              ))
            ) : (
              <div className="col-span-full text-center py-16">
                <div className="max-w-md mx-auto">
                  <Search className="h-16 w-16 text-zinc-600 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-zinc-300 mb-2">Aucune ressource trouvée</h3>
                  <p className="text-zinc-500 mb-6">
                    {getActiveFiltersCount() > 0 
                      ? "Essayez de modifier ou supprimer certains filtres pour voir plus de résultats."
                      : "Il n'y a actuellement aucune ressource disponible."
                    }
                  </p>
                  {getActiveFiltersCount() > 0 && (
                    <Button 
                      onClick={clearAllFilters}
                      variant="outline"
                      className="border-zinc-600 text-zinc-300"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Effacer tous les filtres
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 