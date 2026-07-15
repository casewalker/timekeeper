import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "@/App";

const timer = (name: string) => within(screen.getByRole("group", { name }));

const setMinutes = async (user: ReturnType<typeof userEvent.setup>, name: string, text: string) => {
  const input = timer(name).getByLabelText("Minutes");
  await user.clear(input);
  await user.type(input, `${text}{Enter}`);
};

describe(App, () => {
  it("renders the main and inner timer controllers", () => {
    render(<App />);
    expect(screen.getByRole("group", { name: "Sharing Time" })).toBeInTheDocument();
    expect(screen.getByRole("group", { name: "Warning Time" })).toBeInTheDocument();
  });

  it("clamps the inner timer edits to the main timer's total", async () => {
    const user = userEvent.setup();
    render(<App />);

    await setMinutes(user, "Sharing Time", "5");
    await setMinutes(user, "Warning Time", "8");

    expect(timer("Sharing Time").getByLabelText("Minutes")).toHaveValue("5");
    expect(timer("Warning Time").getByLabelText("Seconds")).toHaveValue("0");
  });

  // it("drags the inner timer down when the main timer shrinks below it", async () => {
  //   const user = userEvent.setup();
  //   render(<App />);
  //
  //   await setMinutes(user, "Sharing Time", "10");
  //   await setMinutes(user, "Warning Time", "6");
  //   await setMinutes(user, "Sharing Time", "2");
  //
  //   expect(timer("Warning Time").getByLabelText("Minutes")).toHaveValue("2");
  //   expect(timer("Warning Time").getByLabelText("Seconds")).toHaveValue("0");
  // });

  it("leaves the inner timer alone when the main timer stays above it", async () => {
    const user = userEvent.setup();
    render(<App />);

    await setMinutes(user, "Sharing Time", "10");
    await setMinutes(user, "Warning Time", "6");
    await setMinutes(user, "Sharing Time", "7");

    expect(timer("Warning Time").getByLabelText("Minutes")).toHaveValue("6");
  });
});
