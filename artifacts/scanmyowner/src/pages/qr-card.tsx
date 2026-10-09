import { useEffect, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { LockKeyhole, ArrowRight, CarFront, Check, CircleHelp, KeyRound, MessageCircle, Plus, Zap } from "lucide-react";
import { useForm } from "react-hook-form";
import {
  getGetQrStatusQueryKey,
  useActivateQr,
  useGetQrStatus,
  type QrActivationInput,
} from "@workspace/api-client-react";
import { ActivateQrBody } from "@workspace/api-zod";
import { Form } from "@/components/ui/form";

const logo = "/brand/scanmyowner-logo.webp";
const contactReasons = [
  { label: "No Parking", Icon: CarFront },
  { label: "Lights On", Icon: Zap },
  { label: "Emergency", Icon: MessageCircle },
  { label: "Key Lost", Icon: KeyRound },
  { label: "Vehicle Issue", Icon: CircleHelp },
  { label: "Other", Icon: Plus },
];

function Meta({ title, description }: { title: string; description: string }) {
  useEffect(() => {
    document.title = title;
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "description");
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", description);
  }, [title, description]);
  return null;
}

function TagShell({ children }: { children: ReactNode }) {
  return <main className="tag-page"><div className="container"><div className="tag-card">{children}</div></div></main>;
}

function TagHeader() {
  return <div className="tag-header">
    <img src={logo} alt="ScanMyOwner logo" />
    <div><strong>ScanMyOwner</strong><span>Smart QR contact</span></div>
  </div>;
}

function Unavailable({ retry }: { retry?: () => void }) {
  return <>
    <Meta title="QR tag unavailable | ScanMyOwner" description="This ScanMyOwner QR tag is invalid or unavailable." />
    <TagShell>
      <TagHeader />
      <h1>QR tag unavailable</h1>
      <p>This QR code is invalid or no longer available. Please check the tag or contact ScanMyOwner support.</p>
      {retry && <button className="btn btn-outline" type="button" onClick={retry} data-testid="button-retry-qr">Try again <ArrowRight size={14} /></button>}
      <div className="tag-privacy"><LockKeyhole size={13} />No owner contact details are shown here.</div>
    </TagShell>
  </>;
}

function ContactPage() {
  const [selected, setSelected] = useState("");
  return <>
    <Meta title="ScanMyOwner | Private vehicle contact" description="Choose a reason to contact the vehicle owner without seeing their personal phone number." />
    <TagShell>
      <TagHeader />
      <div className="tag-car">
        <div className="tag-car-icon"><CarFront size={28} /></div>
        <div><strong>Registered vehicle</strong><span>ScanMyOwner QR tag</span></div>
      </div>
      <h1>How can we help?</h1>
      <p>Choose a reason to get in touch with the owner.</p>
      <div className="tag-reasons">
        {contactReasons.map(({ label, Icon }) => <button
          className={`tag-reason${selected === label ? " selected" : ""}`}
          onClick={() => setSelected(label)}
          key={label}
          data-testid={`qr-contact-${label.toLowerCase().replaceAll(" ", "-")}`}
        >
          <Icon size={16} />{label}<ArrowRight size={13} style={{ marginLeft: "auto" }} />
        </button>)}
      </div>
      {selected && <div className="demo-banner" role="status" data-testid="status-qr-contact-choice">
        {selected} selected. Contact messaging is not connected yet; no message was sent.
      </div>}
      <div className="tag-privacy"><LockKeyhole size={13} />The owner’s personal number is not shown.</div>
    </TagShell>
  </>;
}

function ActivationPage({ code, onActivated }: { code: string; onActivated: () => void }) {
  const queryClient = useQueryClient();
  const activation = useActivateQr();
  const form = useForm<QrActivationInput>({
    resolver: zodResolver(ActivateQrBody),
    defaultValues: {
      ownerName: "",
      ownerPhone: "",
      vehicleMake: "",
      vehicleModel: "",
      vehicleColour: "",
      vehicleRegistration: "",
    },
  });

  function submit(details: QrActivationInput) {
    activation.mutate({ code, data: details }, {
      onSuccess: (result) => {
        form.reset();
        queryClient.setQueryData(getGetQrStatusQueryKey(code), { state: result.state });
        void queryClient.invalidateQueries({ queryKey: getGetQrStatusQueryKey(code) });
        onActivated();
      },
      onError: (error) => {
        if (error.status === 409) {
          void queryClient.invalidateQueries({ queryKey: getGetQrStatusQueryKey(code) });
        }
      },
    });
  }

  const submitError = activation.error?.status === 409
    ? "This QR tag has already been activated or is no longer available."
    : activation.error?.status === 404
      ? "This QR code is invalid or unavailable."
      : activation.error
        ? "Activation could not be completed. Please try again."
        : "";
  const errors = form.formState.errors;

  return <>
    <Meta title="Activate your QR tag | ScanMyOwner" description="Connect your ScanMyOwner QR tag to your vehicle." />
    <TagShell>
      <TagHeader />
      <h1>Activate your QR tag</h1>
      <p>Enter the owner and vehicle details to connect this tag.</p>
      {submitError && <div className="demo-banner" role="alert" data-testid="status-qr-activation-error">{submitError}</div>}
      <Form {...form}>
        <form className="contact-form" onSubmit={form.handleSubmit(submit)} noValidate data-testid="form-qr-activation">
          <label>Owner full name
            <input autoComplete="name" maxLength={100} {...form.register("ownerName", { setValueAs: (value: string) => value.trim().replace(/\s+/g, " ") })} data-testid="input-qr-owner-name" />
            {errors.ownerName && <span className="form-field-error">{errors.ownerName.message}</span>}
          </label>
          <label>Mobile number
            <input type="tel" inputMode="tel" autoComplete="tel" maxLength={16} placeholder="+919876543210" {...form.register("ownerPhone", { setValueAs: (value: string) => value.trim().replace(/[()\s-]/g, "") })} data-testid="input-qr-owner-phone" />
            {errors.ownerPhone && <span className="form-field-error">{errors.ownerPhone.message}</span>}
          </label>
          <label>Vehicle make
            <input autoComplete="off" maxLength={80} {...form.register("vehicleMake", { setValueAs: (value: string) => value.trim().replace(/\s+/g, " ") })} data-testid="input-qr-vehicle-make" />
            {errors.vehicleMake && <span className="form-field-error">{errors.vehicleMake.message}</span>}
          </label>
          <label>Vehicle model
            <input autoComplete="off" maxLength={80} {...form.register("vehicleModel", { setValueAs: (value: string) => value.trim().replace(/\s+/g, " ") })} data-testid="input-qr-vehicle-model" />
            {errors.vehicleModel && <span className="form-field-error">{errors.vehicleModel.message}</span>}
          </label>
          <label>Vehicle colour
            <input autoComplete="off" maxLength={40} {...form.register("vehicleColour", { setValueAs: (value: string) => value.trim().replace(/\s+/g, " ") })} data-testid="input-qr-vehicle-colour" />
            {errors.vehicleColour && <span className="form-field-error">{errors.vehicleColour.message}</span>}
          </label>
          <label>Vehicle registration number
            <input autoComplete="off" autoCapitalize="characters" maxLength={20} {...form.register("vehicleRegistration", { setValueAs: (value: string) => value.trim().toUpperCase().replace(/\s+/g, " ") })} data-testid="input-qr-vehicle-registration" />
            {errors.vehicleRegistration && <span className="form-field-error">{errors.vehicleRegistration.message}</span>}
          </label>
          <button className="btn btn-primary" type="submit" disabled={activation.isPending} data-testid="button-activate-my-qr">
            {activation.isPending ? "Activating…" : "Activate My QR"} <Check size={15} />
          </button>
        </form>
      </Form>
      <div className="tag-privacy"><LockKeyhole size={13} />Your number stays private. No SMS OTP is used.</div>
    </TagShell>
  </>;
}

export default function QrCardPage({ code }: { code: string }) {
  const [activated, setActivated] = useState(false);
  const status = useGetQrStatus(code, {
    query: {
      enabled: Boolean(code),
      queryKey: getGetQrStatusQueryKey(code),
      retry: false,
    },
  });

  if (activated || status.data?.state === "active") return <ContactPage />;
  if (status.isLoading) {
    return <><Meta title="Loading QR tag | ScanMyOwner" description="Checking this ScanMyOwner QR tag." /><TagShell><TagHeader /><p role="status" data-testid="status-qr-loading">Checking this QR tag…</p></TagShell></>;
  }
  if (status.data?.state === "activation_required") {
    return <ActivationPage code={code} onActivated={() => setActivated(true)} />;
  }
  if (status.error?.status === 404 || status.error?.status === 409) {
    return <Unavailable />;
  }
  return <Unavailable retry={() => { void status.refetch(); }} />;
}
