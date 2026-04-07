import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import App from "./App";

describe("App", () => {
  afterEach(() => {
    window.history.replaceState({}, "", "/");
  });

  it("renders the home page hero", () => {
    render(<App />);

    expect(
      screen.getByRole("heading", {
        name: /TikTok growth systems for brands expanding across markets/i
      })
    ).toBeInTheDocument();

    expect(screen.getByRole("link", { name: /Explore services/i })).toBeInTheDocument();
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
});
