import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { LandingHero } from "@/components/landing/LandingHero";
import { LandingNav } from "@/components/landing/LandingNav";
import Landing from "@/pages/Landing";

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    user: null,
    session: null,
    loading: false,
    signOut: vi.fn(),
  }),
}));

vi.mock("@/components/ThemeToggle", () => ({
  ThemeToggle: () => <button type="button" aria-label="Toggle theme" />,
}));

describe("landing page", () => {
  it("shows the product promise and routes to signup", () => {
    render(
      <MemoryRouter>
        <LandingHero />
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { name: /every recording, written and translated/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Get started" })).toHaveAttribute("href", "/signup");
    expect(screen.getByRole("link", { name: "Log in" })).toHaveAttribute("href", "/login");
  });

  it("keeps primary nav links on the marketing page", () => {
    render(
      <MemoryRouter>
        <LandingNav />
      </MemoryRouter>,
    );

    const signupLinks = screen.getAllByRole("link", { name: "Get started" });
    expect(signupLinks[0]).toHaveAttribute("href", "/signup");
    expect(screen.getAllByRole("link", { name: "How it works" })[0]).toHaveAttribute("href", "#how-it-works");
  });

  it("renders the full landing page", () => {
    render(
      <MemoryRouter>
        <Landing />
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { name: /every recording, written and translated/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /what you get from every file/i })).toBeInTheDocument();
  });
});
