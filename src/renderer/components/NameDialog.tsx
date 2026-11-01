import { useEffect, useState } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogBody,
  DialogContent,
  DialogSurface,
  DialogTitle,
  Field,
  Input,
} from "@fluentui/react-components";

export interface NameRequest {
  title: string;
  value: string;
  resolve: (value: string | null) => void;
}

export function NameDialog(props: {
  request: NameRequest | null;
  onClose: (value: string | null) => void;
}) {
  const [value, setValue] = useState("");
  useEffect(() => {
    setValue(props.request?.value ?? "");
  }, [props.request]);
  return (
    <Dialog
      open={Boolean(props.request)}
      onOpenChange={(_, data) => {
        if (!data.open) props.onClose(null);
      }}
    >
      <DialogSurface>
        <DialogBody>
          <DialogTitle>{props.request?.title ?? "Configuration"}</DialogTitle>
          <DialogContent>
            <Field label="Nom">
              <Input
                autoFocus
                id="name-input"
                value={value}
                maxLength={100}
                onChange={(_, data) => setValue(data.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && value.trim())
                    props.onClose(value.trim());
                }}
              />
            </Field>
          </DialogContent>
          <DialogActions>
            <Button appearance="secondary" onClick={() => props.onClose(null)}>
              Annuler
            </Button>
            <Button
              appearance="primary"
              disabled={!value.trim()}
              onClick={() => props.onClose(value.trim())}
            >
              Enregistrer
            </Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
}
