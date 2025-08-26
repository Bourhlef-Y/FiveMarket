"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Search, Mail, MessageSquare, FileQuestion, Clock, ShieldCheck } from "lucide-react";

export default function SupportPage() {
  const [searchQuery, setSearchQuery] = useState('');

  const faqItems = [
    {
      question: "Comment acheter un script ?",
      answer: "Pour acheter un script, naviguez vers la page du script souhaité, cliquez sur 'Acheter', puis suivez le processus de paiement. Une fois l'achat effectué, vous pourrez télécharger le script immédiatement."
    },
    {
      question: "Comment vendre des ressources ?",
      answer: "Pour vendre des ressources sur FiveMarket, créez un compte, validez votre email, puis rendez-vous dans la section 'Vendre'. Tout le monde peut vendre ses créations sur notre plateforme !"
    },
    {
      question: "Quels sont les moyens de paiement acceptés ?",
      answer: "Nous acceptons les paiements par carte bancaire via Stripe, ainsi que PayPal. Les paiements sont sécurisés et les transactions sont instantanées."
    },
    {
      question: "Comment contacter le support ?",
      answer: "Vous pouvez nous contacter via le formulaire de contact ci-dessous, ou par email à support@fivemarket.com. Notre équipe vous répondra dans les plus brefs délais."
    },
    {
      question: "Quelle est votre politique de remboursement ?",
      answer: "Nous offrons un remboursement sous 24h si le script ne fonctionne pas comme décrit. Contactez le support avec votre numéro de commande pour toute demande de remboursement."
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl font-bold text-white mb-6">
              Comment pouvons-nous vous aider ?
            </h1>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-500" />
              <Input
                type="search"
                placeholder="Rechercher dans notre base de connaissances..."
                className="pl-10 py-6 bg-zinc-800 border-zinc-700 text-zinc-100"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Quick Links */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-2 gap-4">
            <Card className="bg-zinc-800/50 border-zinc-700 hover:border-[#FF7101]/50 transition-colors cursor-pointer">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="p-3 rounded-full bg-[#FF7101]/20">
                  <Mail className="h-6 w-6 text-[#FF7101]" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Email</h3>
                  <p className="text-zinc-400">support@fivemarket.com</p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-zinc-800/50 border-zinc-700 hover:border-[#FF7101]/50 transition-colors cursor-pointer">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="p-3 rounded-full bg-[#FF7101]/20">
                  <FileQuestion className="h-6 w-6 text-[#FF7101]" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Documentation</h3>
                  <p className="text-zinc-400">Guides et tutoriels</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-12 bg-zinc-800/30">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-white text-center mb-8">
            Questions fréquentes
          </h2>
          <div className="max-w-3xl mx-auto">
            <Accordion type="single" collapsible className="w-full">
              {faqItems.map((item, index) => (
                <AccordionItem key={index} value={`item-${index}`} className="border-zinc-700">
                  <AccordionTrigger className="text-white hover:text-[#FF7101]">
                    {item.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-zinc-400">
                    {item.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>

      {/* Contact Form */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <Card className="max-w-2xl mx-auto bg-zinc-800/50 border-zinc-700">
            <CardHeader>
              <CardTitle className="text-2xl text-white">Contactez-nous</CardTitle>
              <CardDescription>
                Notre équipe vous répondra dans les plus brefs délais.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-400">Nom</label>
                    <Input className="bg-zinc-900 border-zinc-700 text-zinc-100" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-400">Email</label>
                    <Input type="email" className="bg-zinc-900 border-zinc-700 text-zinc-100" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-400">Sujet</label>
                  <Input className="bg-zinc-900 border-zinc-700 text-zinc-100" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-400">Message</label>
                  <textarea 
                    className="w-full min-h-[150px] rounded-md border bg-zinc-900 border-zinc-700 text-zinc-100 p-3"
                  />
                </div>
                <Button className="w-full bg-[#FF7101] hover:bg-[#FF7101]/90 text-white">
                  Envoyer le message
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Support Features */}
      <section className="py-12 bg-zinc-800/30">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <Clock className="h-12 w-12 text-[#FF7101] mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">Support 24/7</h3>
              <p className="text-zinc-400">
                Notre équipe est disponible à tout moment pour vous aider.
              </p>
            </div>
            <div className="text-center">
              <ShieldCheck className="h-12 w-12 text-[#FF7101] mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">Sécurité garantie</h3>
              <p className="text-zinc-400">
                Vos achats sont protégés par notre garantie satisfaction.
              </p>
            </div>
            <div className="text-center">
              <MessageSquare className="h-12 w-12 text-[#FF7101] mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">Support multilingue</h3>
              <p className="text-zinc-400">
                Assistance disponible en EN/FR.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}