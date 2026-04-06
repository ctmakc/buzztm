import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import App from "./App";

describe("App", () => {
  it("renders the new hero and main CTA", () => {
    render(<App />);

    expect(
      screen.getByRole("heading", {
        name: /create a tiktok buzz wave even when paid reach is blocked/i
      })
    ).toBeInTheDocument();

    expect(screen.getAllByRole("link", { name: /book a strategy call/i }).length).toBeGreaterThan(0);
    expect(screen.getByRole("link", { name: /see the launch flow/i })).toBeInTheDocument();
  });
});
