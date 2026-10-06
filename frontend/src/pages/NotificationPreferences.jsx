import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";

import {
  getCustomerNotificationPreferences,
  updateCustomerNotificationPreferences,
} from "../service/api.js";

const notificationGroups = [
  {
    key: "order_confirmation",
    title: "Order Confirmation",
    description: "When your order has been successfully placed.",
  },
  {
    key: "payment_confirmation",
    title: "Payment Confirmation",
    description: "When your payment has been successfully processed.",
  },
  {
    key: "order_processing",
    title: "Order Processing",
    description: "When your order starts being prepared.",
  },
  {
    key: "order_packed",
    title: "Order Packed",
    description: "When your order has been packed and is ready for shipment.",
  },
  {
    key: "order_shipped",
    title: "Order Shipped",
    description: "When your order leaves our facility.",
  },
  {
    key: "order_out_for_delivery",
    title: "Out for Delivery",
    description: "When your order is on its way to your address.",
  },
  {
    key: "order_delivered",
    title: "Order Delivered",
    description: "When your order has been delivered.",
  },
  {
    key: "promotional_offer",
    title: "Promotional Offers",
    description: "Receive information about offers, launches and special promotions.",
  },
  {
    key: "price_change",
    title: "Price Changes",
    description: "Receive updates when the price of a product changes.",
  },
  {
    key: "back_in_stock",
    title: "Back in Stock",
    description: "Know when products you're interested in become available again.",
  },
];

const channels = [
  {
    key: "email",
    label: "Email",
    icon: "✉",
  },
  {
    key: "sms",
    label: "SMS",
    icon: "▣",
  },
  {
    key: "whatsapp",
    label: "WhatsApp",
    icon: "◉",
  },
];

const buildPreferenceKey = (groupKey, channelKey) =>
  `${groupKey}_${channelKey}`;

const createEmptyPreferences = () => {
  const preferences = {};

  notificationGroups.forEach((group) => {
    channels.forEach((channel) => {
      preferences[
        buildPreferenceKey(group.key, channel.key)
      ] = false;
    });
  });

  return preferences;
};

const normalizePreferences = (data) => {
  const preferences = createEmptyPreferences();

  notificationGroups.forEach((group) => {
    channels.forEach((channel) => {
      const key = buildPreferenceKey(
        group.key,
        channel.key
      );

      preferences[key] = Boolean(data?.[key]);
    });
  });

  return preferences;
};

function NotificationPreferences() {
  const { token, loading: authLoading } = useAuth();

  const [preferences, setPreferences] = useState(
    createEmptyPreferences()
  );

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  /*
  |--------------------------------------------------------------------------
  | LOAD PREFERENCES
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    if (authLoading || !token) {
      return;
    }

    const loadPreferences = async () => {
      try {
        setLoading(true);
        setError("");
        setSuccess("");

        const response =
          await getCustomerNotificationPreferences(
            token
          );

        if (
          response?.success &&
          response?.preferences
        ) {
          setPreferences(
            normalizePreferences(
              response.preferences
            )
          );
        }
      } catch (err) {
        console.error(
          "Failed to load notification preferences:",
          err
        );

        setError(
          err.message ||
            "Failed to load notification preferences."
        );
      } finally {
        setLoading(false);
      }
    };

    loadPreferences();
  }, [token, authLoading]);

  /*
  |--------------------------------------------------------------------------
  | TOGGLE ONE PREFERENCE
  |--------------------------------------------------------------------------
  */

  const handleToggle = (
    groupKey,
    channelKey
  ) => {
    const key = buildPreferenceKey(
      groupKey,
      channelKey
    );

    setPreferences((current) => ({
      ...current,
      [key]: !current[key],
    }));

    setSuccess("");
    setError("");
  };

  /*
  |--------------------------------------------------------------------------
  | SAVE PREFERENCES
  |--------------------------------------------------------------------------
  */

  const handleSave = async () => {
    if (!token || saving) {
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const response =
        await updateCustomerNotificationPreferences(
          token,
          preferences
        );

      if (response?.success) {
        if (response.preferences) {
          setPreferences(
            normalizePreferences(
              response.preferences
            )
          );
        }

        setSuccess(
          "Your notification preferences have been saved."
        );
      } else {
        throw new Error(
          response?.message ||
            "Failed to save notification preferences."
        );
      }
    } catch (err) {
      console.error(
        "Failed to save notification preferences:",
        err
      );

      setError(
        err.message ||
          "Failed to save notification preferences."
      );
    } finally {
      setSaving(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | SELECT ALL FOR ONE CHANNEL
  |--------------------------------------------------------------------------
  */

  const handleChannelToggle = (
    channelKey
  ) => {
    const allEnabled = notificationGroups.every(
      (group) =>
        preferences[
          buildPreferenceKey(
            group.key,
            channelKey
          )
        ]
    );

    setPreferences((current) => {
      const updated = {
        ...current,
      };

      notificationGroups.forEach((group) => {
        updated[
          buildPreferenceKey(
            group.key,
            channelKey
          )
        ] = !allEnabled;
      });

      return updated;
    });

    setSuccess("");
    setError("");
  };

  /*
  |--------------------------------------------------------------------------
  | CLEAR ALL
  |--------------------------------------------------------------------------
  */

  const handleClearAll = () => {
    setPreferences(
      createEmptyPreferences()
    );

    setSuccess("");
    setError("");
  };

  /*
  |--------------------------------------------------------------------------
  | LOADING
  |--------------------------------------------------------------------------
  */

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[#f7f2eb] px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="rounded-3xl border border-[#d9c8ae] bg-white p-10 text-center shadow-[0_20px_60px_rgba(53,23,22,0.08)]">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-[#d9c8ae] border-t-[#7b2737]" />

            <p className="mt-5 text-sm tracking-[0.18em] text-[#6f6259] uppercase">
              Loading preferences
            </p>
          </div>
        </div>
      </div>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | NOT AUTHENTICATED
  |--------------------------------------------------------------------------
  */

  if (!token) {
    return (
      <div className="min-h-screen bg-[#f7f2eb] px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-xl rounded-3xl border border-[#d9c8ae] bg-white p-10 text-center shadow-[0_20px_60px_rgba(53,23,22,0.08)]">
          <h1 className="font-serif text-3xl text-[#351716]">
            Notification Preferences
          </h1>

          <p className="mt-4 text-sm leading-7 text-[#6f6259]">
            Please log in to manage your
            notification preferences.
          </p>

          <a
            href="/login"
            className="mt-7 inline-flex rounded-full bg-[#7b2737] px-7 py-3 text-xs font-semibold tracking-[0.18em] text-white uppercase transition hover:bg-[#61202d]"
          >
            Login
          </a>
        </div>
      </div>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | MAIN UI
  |--------------------------------------------------------------------------
  */

  return (
    <div className="min-h-screen bg-[#f7f2eb] px-4 py-10 pb-24 sm:px-6 sm:py-14 lg:px-8">
      <div className="mx-auto max-w-6xl">

        {/* =====================================================
            PAGE HEADER
        ===================================================== */}

        <div className="mb-10 text-center">
          <p className="mb-3 text-[10px] font-semibold tracking-[0.35em] text-[#a07b3f] uppercase">
            Communication Preferences
          </p>

          <h1 className="font-serif text-4xl font-medium tracking-wide text-[#351716] sm:text-5xl">
            Notification Preferences
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-[#6f6259] sm:text-base">
            Choose how you would like to receive
            updates about your orders, products
            and offers.
          </p>
        </div>

        {/* =====================================================
            STATUS MESSAGES
        ===================================================== */}

        {error && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 rounded-2xl border border-[#d7c39d] bg-[#faf6ed] px-5 py-4 text-sm text-[#5e4828]">
            <div className="flex items-center gap-3">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#7b2737] text-xs text-white">
                ✓
              </span>

              <span>{success}</span>
            </div>
          </div>
        )}

        {/* =====================================================
            MAIN CARD
        ===================================================== */}

        <div className="overflow-hidden rounded-[28px] border border-[#d9c8ae] bg-white shadow-[0_25px_70px_rgba(53,23,22,0.08)]">

          {/* =================================================
              CHANNEL HEADER
          ================================================= */}

          <div className="hidden border-b border-[#eadfd1] bg-[#fbf8f3] md:block">
            <div className="grid grid-cols-[minmax(0,1fr)_360px] items-center px-7 py-5 lg:px-10">

              <div>
                <p className="text-[10px] font-semibold tracking-[0.25em] text-[#9a7b52] uppercase">
                  Notification Type
                </p>
              </div>

              <div className="grid grid-cols-3 gap-4">
                {channels.map((channel) => {
                  const allEnabled =
                    notificationGroups.every(
                      (group) =>
                        preferences[
                          buildPreferenceKey(
                            group.key,
                            channel.key
                          )
                        ]
                    );

                  return (
                    <button
                      key={channel.key}
                      type="button"
                      onClick={() =>
                        handleChannelToggle(
                          channel.key
                        )
                      }
                      className="group flex flex-col items-center gap-1 rounded-xl px-3 py-2 transition hover:bg-[#f3eadf]"
                    >
                      <span className="text-lg text-[#7b2737]">
                        {channel.icon}
                      </span>

                      <span className="text-[10px] font-semibold tracking-[0.16em] text-[#5d5149] uppercase">
                        {channel.label}
                      </span>

                      <span className="text-[9px] text-[#a08f80]">
                        {allEnabled
                          ? "All on"
                          : "Manage"}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* =================================================
              NOTIFICATION ROWS
          ================================================= */}

          <div className="divide-y divide-[#eadfd1]">
            {notificationGroups.map(
              (group) => (
                <div
                  key={group.key}
                  className="px-5 py-6 sm:px-7 lg:px-10"
                >

                  {/* ==============================
                      DESKTOP
                  ============================== */}

                  <div className="hidden items-center md:grid md:grid-cols-[minmax(0,1fr)_360px]">

                    <div className="pr-8">
                      <h2 className="font-serif text-lg text-[#351716]">
                        {group.title}
                      </h2>

                      <p className="mt-1 max-w-xl text-xs leading-6 text-[#7b7068]">
                        {group.description}
                      </p>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      {channels.map(
                        (channel) => {
                          const key =
                            buildPreferenceKey(
                              group.key,
                              channel.key
                            );

                          return (
                            <PreferenceToggle
                              key={key}
                              checked={
                                preferences[
                                  key
                                ]
                              }
                              onChange={() =>
                                handleToggle(
                                  group.key,
                                  channel.key
                                )
                              }
                            />
                          );
                        }
                      )}
                    </div>
                  </div>

                  {/* ==============================
                      MOBILE
                  ============================== */}

                  <div className="md:hidden">

                    <div className="mb-5">
                      <h2 className="font-serif text-lg text-[#351716]">
                        {group.title}
                      </h2>

                      <p className="mt-1 text-xs leading-6 text-[#7b7068]">
                        {group.description}
                      </p>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      {channels.map(
                        (channel) => {
                          const key =
                            buildPreferenceKey(
                              group.key,
                              channel.key
                            );

                          return (
                            <div
                              key={key}
                              className="flex flex-col items-center gap-2 rounded-2xl border border-[#eadfd1] bg-[#fbf8f3] px-2 py-4"
                            >
                              <span className="text-[9px] font-semibold tracking-[0.12em] text-[#76675b] uppercase">
                                {channel.label}
                              </span>

                              <PreferenceToggle
                                checked={
                                  preferences[
                                    key
                                  ]
                                }
                                onChange={() =>
                                  handleToggle(
                                    group.key,
                                    channel.key
                                  )
                                }
                              />
                            </div>
                          );
                        }
                      )}
                    </div>
                  </div>
                </div>
              )
            )}
          </div>

          {/* =================================================
              FOOTER ACTIONS
          ================================================= */}

          <div className="flex flex-col gap-4 border-t border-[#eadfd1] bg-[#fbf8f3] px-5 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-7 lg:px-10">

            <button
              type="button"
              onClick={handleClearAll}
              disabled={saving}
              className="text-left text-xs font-semibold tracking-[0.15em] text-[#806f63] uppercase transition hover:text-[#7b2737] disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm"
            >
              Clear All
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="inline-flex min-h-[48px] items-center justify-center rounded-full bg-[#7b2737] px-8 text-xs font-semibold tracking-[0.2em] text-white uppercase shadow-[0_8px_20px_rgba(123,39,55,0.2)] transition hover:bg-[#61202d] hover:shadow-[0_10px_25px_rgba(123,39,55,0.28)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? (
                <>
                  <span className="mr-3 h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Saving
                </>
              ) : (
                "Save Preferences"
              )}
            </button>
          </div>
        </div>

        {/* =====================================================
            FOOTNOTE
        ===================================================== */}

        <p className="mt-6 text-center text-[10px] leading-5 tracking-wide text-[#95877b]">
          You can change these preferences at
          any time from your account.
        </p>
      </div>
    </div>
  );
}

/*
|--------------------------------------------------------------------------
| TOGGLE COMPONENT
|--------------------------------------------------------------------------
*/

function PreferenceToggle({
  checked,
  onChange,
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      className={`relative h-7 w-12 shrink-0 rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[#c9a45c]/40 ${
        checked
          ? "bg-[#7b2737]"
          : "bg-[#d7cec4]"
      }`}
    >
      <span
        className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-md transition-all duration-300 ${
          checked
            ? "left-6"
            : "left-1"
        }`}
      />
    </button>
  );
}

export default NotificationPreferences;