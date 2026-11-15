interface ConfirmationMessage {
  title: string;
  message: string;
  action: string;
}

export function confirmCrmAction(dialog: HTMLDialogElement | null, confirmation: ConfirmationMessage): Promise<boolean> {
  if (!dialog?.showModal || dialog.open) return Promise.resolve(false);

  const title = dialog.querySelector("[data-confirm-title]");
  const message = dialog.querySelector("[data-confirm-message]");
  const action = dialog.querySelector("[data-confirm-action]");
  if (!title || !message || !action) return Promise.resolve(false);

  title.textContent = confirmation.title;
  message.textContent = confirmation.message;
  action.textContent = confirmation.action;
  dialog.returnValue = "";
  dialog.showModal();

  return new Promise((resolve) => {
    dialog.addEventListener("close", () => resolve(dialog.returnValue === "confirm"), { once: true });
  });
}
