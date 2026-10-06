import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const SiteSettingsContext = createContext(null);

const DEFAULT_SETTINGS = {
  brand_name: "VINEORA",
  logo_url: null,
  favicon_url: null,
  contact_email: "",
  contact_phone: "",
   whatsapp_support_enabled: false,
  whatsapp_number: "",
  address: "",

  currency: "INR",
  tax_percentage: 0,
  shipping_charge: 0,
  minimum_order_value: 0,
  coupon_enabled: true,

  local_pickup_enabled: false,
  delivery_timings: "",

  age_verification_enabled: true,
  age_verification_method: "birthdate",
  age_verification_message:
    "You must be of legal drinking age to enter this website.",
  age_verification_redirect_url: "",
};

export const SiteSettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadSettings = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          "http://localhost:5000/api/settings/public"
        );

        const data = await response.json();

        if (!response.ok || !data?.success) {
          throw new Error(
            data?.message || "Failed to load site settings"
          );
        }

        setSettings({
          ...DEFAULT_SETTINGS,
          ...(data.settings || {}),
        });
      } catch (err) {
        console.error(
          "Site settings loading error:",
          err
        );

        setError(
          err.message || "Unable to load site settings."
        );
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, []);

  /*
  |--------------------------------------------------------------------------
  | UPDATE FAVICON
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    if (!settings.favicon_url) {
      return;
    }

    let favicon = document.querySelector(
      'link[rel="icon"]'
    );

    if (!favicon) {
      favicon = document.createElement("link");
      favicon.rel = "icon";
      document.head.appendChild(favicon);
    }

    favicon.href = settings.favicon_url;
  }, [settings.favicon_url]);

  const value = useMemo(
    () => ({
      settings,
      loading,
      error,
    }),
    [settings, loading, error]
  );

  return (
    <SiteSettingsContext.Provider value={value}>
      {children}
    </SiteSettingsContext.Provider>
  );
};

export const useSiteSettings = () => {
  const context = useContext(
    SiteSettingsContext
  );

  if (!context) {
    throw new Error(
      "useSiteSettings must be used inside SiteSettingsProvider"
    );
  }

  return context;
};