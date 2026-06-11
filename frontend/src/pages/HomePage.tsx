import { ArrowRight, Shield, Zap, Cloud } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

const features = [
  {
    icon: Shield,
    title: "Secure Authentication",
    description:
      "JWT-based auth with refresh token rotation, HTTP-only cookies, and role-based access control.",
  },
  {
    icon: Zap,
    title: "Lightning Fast API",
    description:
      "Optimized PostgreSQL queries with connection pooling and async notification processing via RabbitMQ.",
  },
  {
    icon: Cloud,
    title: "Cloud Ready",
    description:
      "Built for scale with message queues, rate limiting, and production-grade error handling.",
  },
];

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex-1">
        <section className="container mx-auto px-4 py-20 sm:px-6 sm:py-28 lg:px-8 lg:py-36">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-6xl">
              Build Your Next
              <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                {" "}
                E-Commerce Platform
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-base text-muted-foreground sm:text-lg">
              A production-ready starter with secure authentication, real-time
              notifications, and a modern tech stack. Ship faster, scale easier.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button size="lg" asChild>
                <Link to="/register">
                  Get Started
                  <ArrowRight className="ml-2 size-4" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link to="/login">Sign In</Link>
              </Button>
            </div>
          </div>
        </section>

        <section
          id="features"
          className="container mx-auto px-4 py-16 sm:px-6 lg:px-8"
        >
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Everything You Need
            </h2>
            <p className="mt-3 text-muted-foreground">
              Built with best practices for security, performance, and developer
              experience.
            </p>
          </div>
          <div className="mx-auto mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <Card
                key={feature.title}
                className="transition-shadow hover:shadow-lg"
              >
                <CardHeader>
                  <div className="mb-2 inline-flex size-10 items-center justify-center rounded-lg bg-primary/10">
                    <feature.icon className="size-5 text-primary" />
                  </div>
                  <CardTitle>{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section
          id="about"
          className="container mx-auto px-4 py-16 sm:px-6 lg:px-8"
        >
          <div className="mx-auto max-w-3xl rounded-2xl bg-muted/50 p-8 text-center sm:p-12">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Ready to Get Started?
            </h2>
            <p className="mt-3 text-muted-foreground">
              Create an account in seconds and start exploring the platform.
            </p>
            <Button className="mt-6" size="lg" asChild>
              <Link to="/register">
                Create Account
                <ArrowRight className="ml-2 size-4" />
              </Link>
            </Button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
