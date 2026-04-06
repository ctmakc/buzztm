import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import App from "./App";

describe("App", () => {
  it("renders the new hero and services CTA", () => {
    render(<App />);

    expect(
      screen.getByRole("heading", {
        name: /tikTok campaigns built for revenue/i
      })
    ).toBeInTheDocument();

    expect(screen.getAllByRole("link", { name: /book strategy session/i }).length).toBeGreaterThan(0);
    expect(screen.getByRole("link", { name: /see delivery model/i })).toBeInTheDocument();
  });
});
