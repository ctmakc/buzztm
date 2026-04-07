import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import App from "./App";

describe("App", () => {
  afterEach(() => {
    cleanup();
    window.history.replaceState({}, "", "/");
  });

  it("renders the home page hero", () => {
    render(<App />);

    expect(
      screen.getByRole("heading", {
        name: /Build the launch system before you buy more traffic/i
      })
    ).toBeInTheDocument();

    expect(screen.getByRole("link", { name: /Explore services/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Request launch plan/i })).toBeInTheDocument();
  });

  it("renders the services page from pathname", () => {
    window.history.replaceState({}, "", "/services/");
    render(<App />);

    expect(
      screen.getByRole("heading", {
        name: /Structured offers for brands that need TikTok execution/i
      })
    ).toBeInTheDocument();
  });

  it("renders a service detail page from pathname", () => {
    window.history.replaceState({}, "", "/services/launch-burst/");
    render(<App />);

    expect(screen.getByRole("heading", { level: 1, name: /Launch Burst/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Request Launch Burst/i })).toBeInTheDocument();
  });

  it("renders the blog page from pathname", () => {
    window.history.replaceState({}, "", "/blog/");
    render(<App />);

    expect(
      screen.getByRole("heading", {
        name: /Commercial articles for buyers who need more than one landing-page claim/i
      })
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Read featured article/i })).toBeInTheDocument();
  });

  it("renders the contact intake form above the fold content", () => {
    window.history.replaceState({}, "", "/contact/");
    render(<App />);

    expect(screen.getByRole("heading", { name: /Tell us the market, the offer, and the timing/i })).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: /What do you need\?/i })).toBeInTheDocument();
  });
});
