import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { LandingHero } from "@/components/landing/LandingHero";
import { LandingNav } from "@/components/landing/LandingNav";
import Landing from "@/pages/Landing";

vi.mock("@/components/ThemeToggle", () => ({
  ThemeToggle: () => <button type="button" aria-label="Toggle theme" />,
}));

describe("landing page", () => {
  it("shows the product promise and opens the app", () => {
    render(
      <MemoryRouter>
        <LandingHero />
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { name: /every recording, written and translated/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open app" })).toHaveAttribute("href", "/app");
    expect(screen.queryByRole("link", { name: "Log in" })).not.toBeInTheDocument();
  });

  it("keeps primary nav links on the marketing page", () => {
    render(
      <MemoryRouter>
        <LandingNav />
      </MemoryRouter>,
    );

    const appLinks = screen.getAllByRole("link", { name: "Open app" });
    expect(appLinks[0]).toHaveAttribute("href", "/app");
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
