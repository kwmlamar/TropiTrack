"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ModeToggle } from "@/components/mode-toggle"
import { PricingToggle } from "@/components/pricing-toggle"
import { FaqAccordion } from "@/components/faq-accordion"
import { NewsletterForm } from "@/components/newsletter-form"
import { Clock, CreditCard, Users, Smartphone, CheckCircle, ArrowRight } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="rounded-md bg-primary p-1">
              <Clock className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold tracking-tight">TropiTrack</span>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <Link href="#features" className="text-sm font-medium transition-colors hover:text-primary">
              Features
            </Link>
            <Link href="#how-it-works" className="text-sm font-medium transition-colors hover:text-primary">
              How It Works
            </Link>
            <Link href="#pricing" className="text-sm font-medium transition-colors hover:text-primary">
              Pricing
            </Link>
            <Link href="#faq" className="text-sm font-medium transition-colors hover:text-primary">
              FAQ
            </Link>
          </nav>
          <div className="flex items-center gap-4">
            <ModeToggle />
            <Button asChild variant="outline" className="hidden md:flex">
              <Link href="#contact">Contact</Link>
            </Button>
            <Button asChild variant="outline" className="hidden md:flex">
              <Link href="/login">Log In</Link>
            </Button>
            <Button asChild>
              <Link href="/signup">Try it free</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden py-20 md:py-32 lg:py-40">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-background"></div>
          <div className="container mx-auto px-4 relative z-10">
            <div className="grid gap-8 lg:grid-cols-2 lg:gap-16 items-center">
              <div className="flex flex-col gap-6">
                <div className="inline-flex items-center rounded-full border px-3 py-1 text-sm">
                  <span className="mr-1 rounded-full bg-primary h-2 w-2"></span>
                  <span className="text-muted-foreground">Built for Bahamian construction teams</span>
                </div>
                <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
                  Track time, manage payroll, <span className="text-primary">simplify construction</span>
                </h1>
                <p className="text-xl text-muted-foreground">
                  The all-in-one platform for construction companies in the Bahamas to track time, manage workers, and
                  streamline payroll.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button size="lg" className="group">
                    Try it free
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                  <Button size="lg" variant="outline">
                    Schedule a demo
                  </Button>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center">
                    <CheckCircle className="mr-1 h-4 w-4 text-primary" />
                    No credit card
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="mr-1 h-4 w-4 text-primary" />
                    14-day free trial
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="mr-1 h-4 w-4 text-primary" />
                    Cancel anytime
                  </div>
                </div>
              </div>
              <div className="relative">
                <div className="relative rounded-lg border bg-card p-2 shadow-xl">
                  <Image
                    src="/placeholder.svg?height=600&width=800"
                    alt="TropiTrack Dashboard"
                    width={800}
                    height={600}
                    className="rounded shadow-sm"
                  />
                </div>
                <div className="absolute -top-6 -right-6 h-24 w-24 rounded-full bg-primary/20 blur-2xl"></div>
                <div className="absolute -bottom-6 -left-6 h-24 w-24 rounded-full bg-primary/20 blur-2xl"></div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-20 bg-muted/50">
          <div className="container mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
                Everything you need to manage your crew
              </h2>
              <p className="mt-4 text-xl text-muted-foreground max-w-3xl mx-auto">
                Powerful features designed specifically for construction teams in the Caribbean
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
              <Card className="bg-card transition-all hover:shadow-lg hover:-translate-y-1">
                <CardContent className="p-6 pt-8">
                  <div className="mb-4 rounded-full bg-primary/10 p-3 w-fit">
                    <Clock className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold">Time Tracking</h3>
                  <p className="mt-2 text-muted-foreground">
                    Simple clock in/out for workers with GPS verification and project assignment
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-card transition-all hover:shadow-lg hover:-translate-y-1">
                <CardContent className="p-6 pt-8">
                  <div className="mb-4 rounded-full bg-primary/10 p-3 w-fit">
                    <CreditCard className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold">Payroll Management</h3>
                  <p className="mt-2 text-muted-foreground">
                    Automated calculations for regular, overtime, and holiday pay with local compliance
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-card transition-all hover:shadow-lg hover:-translate-y-1">
                <CardContent className="p-6 pt-8">
                  <div className="mb-4 rounded-full bg-primary/10 p-3 w-fit">
                    <Users className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold">Worker Management</h3>
                  <p className="mt-2 text-muted-foreground">
                    Track skills, certifications, availability, and performance across projects
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-card transition-all hover:shadow-lg hover:-translate-y-1">
                <CardContent className="p-6 pt-8">
                  <div className="mb-4 rounded-full bg-primary/10 p-3 w-fit">
                    <Smartphone className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold">Mobile Friendly</h3>
                  <p className="mt-2 text-muted-foreground">
                    Works offline on any device with automatic syncing when back online
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="py-20">
          <div className="container mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">How TropiTrack works</h2>
              <p className="mt-4 text-xl text-muted-foreground max-w-3xl mx-auto">
                Three simple steps to transform your construction time tracking
              </p>
            </div>

            <div className="grid gap-12 lg:grid-cols-3">
              <div className="flex flex-col items-center text-center">
                <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground">
                  1
                </div>
                <h3 className="text-2xl font-bold">Set up your team</h3>
                <p className="mt-2 text-muted-foreground">
                  Add workers, projects, and job sites to your account. Set pay rates and overtime rules.
                </p>
                <div className="mt-6 rounded-lg border bg-card p-2 shadow-md">
                  <Image
                    src="/placeholder.svg?height=300&width=400"
                    alt="Team Setup Screenshot"
                    width={400}
                    height={300}
                    className="rounded"
                  />
                </div>
              </div>

              <div className="flex flex-col items-center text-center">
                <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground">
                  2
                </div>
                <h3 className="text-2xl font-bold">Track time & attendance</h3>
                <p className="mt-2 text-muted-foreground">
                  Workers clock in/out using the mobile app or web dashboard with GPS verification.
                </p>
                <div className="mt-6 rounded-lg border bg-card p-2 shadow-md">
                  <Image
                    src="/placeholder.svg?height=300&width=400"
                    alt="Time Tracking Screenshot"
                    width={400}
                    height={300}
                    className="rounded"
                  />
                </div>
              </div>

              <div className="flex flex-col items-center text-center">
                <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground">
                  3
                </div>
                <h3 className="text-2xl font-bold">Process payroll & reports</h3>
                <p className="mt-2 text-muted-foreground">
                  Review timesheets, approve hours, and export payroll data with a few clicks.
                </p>
                <div className="mt-6 rounded-lg border bg-card p-2 shadow-md">
                  <Image
                    src="/placeholder.svg?height=300&width=400"
                    alt="Payroll Screenshot"
                    width={400}
                    height={300}
                    className="rounded"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        {/*
        <section className="py-20 bg-muted/50">
          <div className="container mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
                Trusted by construction teams
              </h2>
              <p className="mt-4 text-xl text-muted-foreground max-w-3xl mx-auto">
                See what other Bahamian construction companies are saying
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              <Card className="bg-card">
                <CardContent className="p-6">
                  <div className="flex text-primary mb-4">
                    {[...Array(5)].map((_, i) => (
                      <svg
                        key={i}
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        className="h-5 w-5"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z"
                          clipRule="evenodd"
                        />
                      </svg>
                    ))}
                  </div>
                  <blockquote className="mb-4">
                    "TropiTrack has transformed how we manage our crews. We've cut payroll processing time by 75% and
                    eliminated timesheet errors."
                  </blockquote>
                  <div className="flex items-center">
                    <div className="mr-4 h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                      <Building2 className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">Michael Johnson</p>
                      <p className="text-sm text-muted-foreground">Nassau Construction Ltd</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card">
                <CardContent className="p-6">
                  <div className="flex text-primary mb-4">
                    {[...Array(5)].map((_, i) => (
                      <svg
                        key={i}
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        className="h-5 w-5"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z"
                          clipRule="evenodd"
                        />
                      </svg>
                    ))}
                  </div>
                  <blockquote className="mb-4">
                    "The offline capability is perfect for our remote job sites. Workers can clock in/out even without
                    internet, and it syncs later."
                  </blockquote>
                  <div className="flex items-center">
                    <div className="mr-4 h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                      <Building2 className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">Sarah Williams</p>
                      <p className="text-sm text-muted-foreground">Island Builders Co.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card md:col-span-2 lg:col-span-1">
                <CardContent className="p-6">
                  <div className="flex text-primary mb-4">
                    {[...Array(5)].map((_, i) => (
                      <svg
                        key={i}
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        className="h-5 w-5"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z"
                          clipRule="evenodd"
                        />
                      </svg>
                    ))}
                  </div>
                  <blockquote className="mb-4">
                    "As a small contractor, I needed something simple but powerful. TropiTrack gives me enterprise
                    features at a price I can afford."
                  </blockquote>
                  <div className="flex items-center">
                    <div className="mr-4 h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                      <Building2 className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">David Thompson</p>
                      <p className="text-sm text-muted-foreground">Thompson & Sons Construction</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section> 
        */}

        {/* Pricing Section */}
        <section id="pricing" className="py-20">
          <div className="container mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">Simple, transparent pricing</h2>
              <p className="mt-4 text-xl text-muted-foreground max-w-3xl mx-auto">
                Choose the plan that works best for your construction business
              </p>
              <div className="mt-8">
                <PricingToggle onToggle={() => {}} />
              </div>
            </div>

            <div className="grid gap-8 md:grid-cols-3">
              <Card className="bg-card">
                <CardContent className="p-6">
                  <div className="mb-4">
                    <h3 className="text-2xl font-bold">Starter</h3>
                    <p className="text-muted-foreground">For small teams getting started</p>
                  </div>
                  <div className="mb-4">
                    <span className="text-4xl font-bold">$29</span>
                    <span className="text-muted-foreground">/month</span>
                  </div>
                  <ul className="mb-6 space-y-2">
                    <li className="flex items-center">
                      <CheckCircle className="mr-2 h-5 w-5 text-primary" />
                      <span>Up to 10 workers</span>
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="mr-2 h-5 w-5 text-primary" />
                      <span>Basic time tracking</span>
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="mr-2 h-5 w-5 text-primary" />
                      <span>Simple payroll reports</span>
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="mr-2 h-5 w-5 text-primary" />
                      <span>Mobile app access</span>
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="mr-2 h-5 w-5 text-primary" />
                      <span>Email support</span>
                    </li>
                  </ul>
                  <Button className="w-full">Get Started</Button>
                </CardContent>
              </Card>

              <Card className="bg-card relative border-primary">
                <div className="absolute -top-4 left-0 right-0 mx-auto w-fit rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">
                  Most Popular
                </div>
                <CardContent className="p-6">
                  <div className="mb-4">
                    <h3 className="text-2xl font-bold">Professional</h3>
                    <p className="text-muted-foreground">For growing construction teams</p>
                  </div>
                  <div className="mb-4">
                    <span className="text-4xl font-bold">$79</span>
                    <span className="text-muted-foreground">/month</span>
                  </div>
                  <ul className="mb-6 space-y-2">
                    <li className="flex items-center">
                      <CheckCircle className="mr-2 h-5 w-5 text-primary" />
                      <span>Up to 30 workers</span>
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="mr-2 h-5 w-5 text-primary" />
                      <span>Advanced time tracking</span>
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="mr-2 h-5 w-5 text-primary" />
                      <span>Full payroll integration</span>
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="mr-2 h-5 w-5 text-primary" />
                      <span>Project cost tracking</span>
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="mr-2 h-5 w-5 text-primary" />
                      <span>GPS verification</span>
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="mr-2 h-5 w-5 text-primary" />
                      <span>Priority support</span>
                    </li>
                  </ul>
                  <Button className="w-full">Get Started</Button>
                </CardContent>
              </Card>

              <Card className="bg-card">
                <CardContent className="p-6">
                  <div className="mb-4">
                    <h3 className="text-2xl font-bold">Enterprise</h3>
                    <p className="text-muted-foreground">For large construction companies</p>
                  </div>
                  <div className="mb-4">
                    <span className="text-4xl font-bold">$199</span>
                    <span className="text-muted-foreground">/month</span>
                  </div>
                  <ul className="mb-6 space-y-2">
                    <li className="flex items-center">
                      <CheckCircle className="mr-2 h-5 w-5 text-primary" />
                      <span>Unlimited workers</span>
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="mr-2 h-5 w-5 text-primary" />
                      <span>Advanced analytics</span>
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="mr-2 h-5 w-5 text-primary" />
                      <span>Custom integrations</span>
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="mr-2 h-5 w-5 text-primary" />
                      <span>Multi-site management</span>
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="mr-2 h-5 w-5 text-primary" />
                      <span>Advanced reporting</span>
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="mr-2 h-5 w-5 text-primary" />
                      <span>Dedicated account manager</span>
                    </li>
                  </ul>
                  <Button className="w-full">Contact Sales</Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section id="faq" className="py-20 bg-muted/50">
          <div className="container mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">Frequently asked questions</h2>
              <p className="mt-4 text-xl text-muted-foreground max-w-3xl mx-auto">
                Everything you need to know about TropiTrack
              </p>
            </div>

            <div className="mx-auto max-w-3xl">
              <FaqAccordion />
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section id="try-free" className="py-20">
          <div className="container mx-auto px-6">
            <div className="rounded-2xl bg-gradient-to-br from-primary/20 via-primary/10 to-background p-8 md:p-12 lg:p-16 relative overflow-hidden">
              <div className="absolute top-0 right-0 -mt-16 -mr-16 h-64 w-64 rounded-full bg-primary/20 blur-3xl"></div>
              <div className="relative z-10 max-w-3xl">
                <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
                  Ready to transform your construction business?
                </h2>
                <p className="mt-4 text-xl text-muted-foreground">
                  Join the growing number of Bahamian construction teams using TropiTrack to simplify time tracking and
                  payroll.
                </p>
                <div className="mt-8 flex flex-col sm:flex-row gap-4">
                  <Button size="lg" className="group">
                    Start your free trial
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                  <Button size="lg" variant="outline">
                    Schedule a demo
                  </Button>
                </div>
                <div className="mt-6">
                  <p className="text-sm text-muted-foreground">
                    No credit card required. 14-day free trial. Cancel anytime.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Newsletter Section */}
        <section id="contact" className="py-20 bg-muted/50">
          <div className="container mx-auto px-6">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Stay updated with TropiTrack</h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Subscribe to our newsletter for the latest features, tips, and construction industry insights.
              </p>
              <div className="mt-8 flex justify-center">
                <NewsletterForm />
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t bg-card">
        <div className="container mx-auto px-6 py-12">
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="rounded-md bg-primary p-1">
                  <Clock className="h-5 w-5 text-primary-foreground" />
                </div>
                <span className="text-xl font-bold tracking-tight">TropiTrack</span>
              </div>
              <p className="text-muted-foreground">
                Modern time tracking and payroll management for construction companies in the Bahamas.
              </p>
              <div className="mt-4 flex space-x-4">
                <Button variant="ghost" size="icon" className="rounded-full">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-5 w-5"
                  >
                    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                  </svg>
                  <span className="sr-only">Facebook</span>
                </Button>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-5 w-5"
                  >
                    <rect width="20" height="20" x="2" y="2" rx="5" ry="5"></rect>
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"></line>
                  </svg>
                  <span className="sr-only">Instagram</span>
                </Button>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-5 w-5"
                  >
                    <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path>
                  </svg>
                  <span className="sr-only">Twitter</span>
                </Button>
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="#features" className="text-muted-foreground hover:text-foreground transition-colors">
                    Features
                  </Link>
                </li>
                <li>
                  <Link href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors">
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                    Integrations
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                    Documentation
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                    API
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                    Security
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                    About
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                    Careers
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                    Support
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                    Terms of Service
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Contact</h3>
              <ul className="space-y-2">
                <li>
                  <p className="text-muted-foreground">
                    Email: <a href="mailto:classicalsineus@gmail.com">classicalsineus@gmail.com</a>
                  </p>
                </li>
                <li>
                  <p className="text-muted-foreground">
                    Phone: <a href="tel:+13349130982">+1 (334) 913-0982</a>
                  </p>
                </li>
                <li>
                  <p className="text-muted-foreground">Address: Eleuthera, Bahamas</p>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-8 text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} TropiTrack. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}
