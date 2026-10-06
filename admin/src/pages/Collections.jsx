import React, { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Power,
  X,
  Search,
  Package,
  Layers,
  Gift,
  Save,
  ImageIcon,
  Minus,
} from "lucide-react";
import { useAdminAuth } from "../context/AdminAuthContext";

const API_BASE = "http://localhost:5000/api";

const getToken = () =>
  sessionStorage.getItem("adminToken") ||
  sessionStorage.getItem("token") ||
  localStorage.getItem("adminToken") ||
  localStorage.getItem("token");

const getImageUrl = (imageUrl) => {
  if (!imageUrl) return "";

  if (
    imageUrl.startsWith("http://") ||
    imageUrl.startsWith("https://")
  ) {
    return imageUrl;
  }

  return `http://localhost:5000${
    imageUrl.startsWith("/") ? imageUrl : `/${imageUrl}`
  }`;
};

const emptyCollection = {
  name: "",
  slug: "",
  description: "",
  is_active: true,
};

const emptyGiftSet = {
  name: "",
  description: "",
  selling_price: "",
  mrp: "",
  image_url: "",
  stock_quantity: 0,
  is_active: true,
  items: [],
};

function Collections() {
  const { token: contextToken } = useAdminAuth();

  const token = contextToken || getToken();

  const authHeaders = useMemo(
    () => ({
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    }),
    [token]
  );

  const [activeTab, setActiveTab] = useState("collections");

  const [collections, setCollections] = useState([]);
  const [giftSets, setGiftSets] = useState([]);
  const [products, setProducts] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [collectionModal, setCollectionModal] = useState(false);
  const [giftSetModal, setGiftSetModal] = useState(false);

  const [editingCollection, setEditingCollection] = useState(null);
  const [editingGiftSet, setEditingGiftSet] = useState(null);

  const [collectionForm, setCollectionForm] =
    useState(emptyCollection);

  const [giftSetForm, setGiftSetForm] =
    useState(emptyGiftSet);

  const [giftSetImageFile, setGiftSetImageFile] =
    useState(null);

  const [productSearch, setProductSearch] = useState("");
  const [selectedProductIds, setSelectedProductIds] =
    useState([]);

  const [variantSearch, setVariantSearch] = useState("");

  // =====================================================
  // LOAD DATA
  // =====================================================

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      const [
        collectionsResponse,
        giftSetsResponse,
        productsResponse,
      ] = await Promise.all([
        fetch(`${API_BASE}/admin/collections`, {
          headers: authHeaders,
        }),

        fetch(`${API_BASE}/admin/gift-sets`, {
          headers: authHeaders,
        }),

        fetch(`${API_BASE}/products?limit=500`, {
          headers: {
            "Content-Type": "application/json",
          },
        }),
      ]);

      const collectionsData =
        await collectionsResponse.json();

      const giftSetsData =
        await giftSetsResponse.json();

      const productsData =
        await productsResponse.json();

      if (
        !collectionsResponse.ok ||
        !collectionsData.success
      ) {
        throw new Error(
          collectionsData.message ||
            "Failed to load collections."
        );
      }

      if (
        !giftSetsResponse.ok ||
        !giftSetsData.success
      ) {
        throw new Error(
          giftSetsData.message ||
            "Failed to load gift sets."
        );
      }

      if (!productsResponse.ok) {
        throw new Error(
          productsData.message ||
            "Failed to load products."
        );
      }

      setCollections(
        collectionsData.collections ||
          collectionsData.data ||
          []
      );

      setGiftSets(
        giftSetsData.giftSets ||
          giftSetsData.data ||
          []
      );

      setProducts(
        productsData.products ||
          productsData.data?.products ||
          productsData.data ||
          []
      );
    } catch (err) {
      console.error(
        "Collection management error:",
        err
      );

      setError(
        err.message ||
          "Failed to load collection data."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // =====================================================
  // HELPERS
  // =====================================================

  const slugify = (value) => {
    return value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  const getProductVariants = (product) => {
    return (
      product?.variants ||
      product?.product_variants ||
      []
    );
  };

  const getProductImage = (product) => {
    return (
      product?.image_url ||
      product?.image ||
      product?.primary_image ||
      product?.images?.[0]?.image_url ||
      ""
    );
  };

  const getProductType = (product) => {
    return (
      product?.wine_type ||
      product?.type ||
      product?.category_name ||
      ""
    );
  };

  const getProductWinery = (product) => {
    return (
      product?.winery_name ||
      product?.winery ||
      product?.wineryName ||
      ""
    );
  };

  const getVariantLabel = (variant) => {
    const bottleSize =
      variant?.bottle_size ||
      variant?.bottleSize ||
      "";

    const sellingPrice = Number(
      variant?.selling_price ||
        variant?.sellingPrice ||
        0
    );

    const mrp = Number(
      variant?.mrp || 0
    );

    const price =
      sellingPrice > 0
        ? sellingPrice
        : mrp;

    return `${bottleSize || "Standard"}${
      price > 0 ? ` • ₹${price}` : ""
    }`;
  };

  const getDiscount = (
    mrp,
    sellingPrice
  ) => {
    const m = Number(mrp || 0);
    const s = Number(sellingPrice || 0);

    if (!m || !s || s >= m) {
      return 0;
    }

    return Math.round(
      ((m - s) / m) * 100
    );
  };

  // =====================================================
  // COLLECTION PRODUCT FILTER
  // =====================================================

  const filteredCollectionProducts =
    useMemo(() => {
      const search =
        productSearch.toLowerCase().trim();

      if (!search) {
        return products;
      }

      return products.filter((product) => {
        const name =
          product?.name?.toLowerCase() || "";

        const winery =
          getProductWinery(
            product
          ).toLowerCase();

        const type =
          getProductType(
            product
          ).toLowerCase();

        const grape =
          product?.grape_variety?.toLowerCase() ||
          product?.grape?.toLowerCase() ||
          "";

        return (
          name.includes(search) ||
          winery.includes(search) ||
          type.includes(search) ||
          grape.includes(search)
        );
      });
    }, [products, productSearch]);

  // =====================================================
  // ALL PRODUCT VARIANTS
  // =====================================================

  const allVariants = useMemo(() => {
    const result = [];

    products.forEach((product) => {
      const variants =
        getProductVariants(product);

      variants.forEach((variant) => {
        if (
          variant?.is_active === false ||
          variant?.isActive === false
        ) {
          return;
        }

        const variantId = Number(
          variant?.id ||
            variant?.variant_id ||
            variant?.product_variant_id
        );

        if (!variantId) {
          return;
        }

        result.push({
          ...variant,
          id: variantId,
          product_id: Number(product.id),
          product_name: product.name,
          product_image:
            getProductImage(product),
          product_type:
            getProductType(product),
          winery_name:
            getProductWinery(product),
        });
      });
    });

    return result;
  }, [products]);

  const filteredVariants = useMemo(() => {
    const search =
      variantSearch.toLowerCase().trim();

    if (!search) {
      return allVariants;
    }

    return allVariants.filter(
      (variant) => {
        return (
          variant.product_name
            ?.toLowerCase()
            .includes(search) ||
          variant.bottle_size
            ?.toLowerCase()
            .includes(search) ||
          variant.sku
            ?.toLowerCase()
            .includes(search) ||
          variant.product_type
            ?.toLowerCase()
            .includes(search) ||
          variant.winery_name
            ?.toLowerCase()
            .includes(search)
        );
      }
    );
  }, [allVariants, variantSearch]);

  // =====================================================
  // COLLECTION MODAL
  // =====================================================

  const openCreateCollection = () => {
    setEditingCollection(null);

    setCollectionForm({
      ...emptyCollection,
    });

    setSelectedProductIds([]);
    setProductSearch("");

    setError("");
    setSuccess("");

    setCollectionModal(true);
  };

  const handleEditCollection = async (
    collection
  ) => {
    try {
      setError("");

      const response = await fetch(
        `${API_BASE}/admin/collections/${collection.id}`,
        {
          headers: authHeaders,
        }
      );

      const data =
        await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Failed to load collection."
        );
      }

      const item =
        data.collection ||
        data.data?.collection ||
        data.data;

      setEditingCollection(item);

      setCollectionForm({
        name: item?.name || "",
        slug: item?.slug || "",
        description:
          item?.description || "",
        is_active:
          item?.is_active !== false,
      });

      const productIds = (
        item?.products || []
      )
        .map((product) =>
          Number(product.id)
        )
        .filter(Boolean);

      setSelectedProductIds(productIds);
      setProductSearch("");

      setCollectionModal(true);
    } catch (err) {
      console.error(
        "Collection edit error:",
        err
      );

      setError(
        err.message ||
          "Failed to load collection."
      );
    }
  };

  const handleCollectionNameChange = (
    value
  ) => {
    setCollectionForm((prev) => ({
      ...prev,
      name: value,
      slug: editingCollection
        ? prev.slug
        : slugify(value),
    }));
  };

  const toggleProductSelection = (
    productId
  ) => {
    const id = Number(productId);

    setSelectedProductIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter(
          (existingId) =>
            existingId !== id
        );
      }

      return [...prev, id];
    });
  };

  const selectAllVisibleProducts = () => {
    const visibleIds =
      filteredCollectionProducts
        .map((product) =>
          Number(product.id)
        )
        .filter(Boolean);

    setSelectedProductIds((prev) =>
      Array.from(
        new Set([
          ...prev,
          ...visibleIds,
        ])
      )
    );
  };

  const clearSelectedProducts = () => {
    setSelectedProductIds([]);
  };

  const handleSaveCollection = async (
    event
  ) => {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      if (!collectionForm.name.trim()) {
        throw new Error(
          "Collection name is required."
        );
      }

      const payload = {
        name: collectionForm.name.trim(),

        slug:
          collectionForm.slug.trim() ||
          slugify(collectionForm.name),

        description:
          collectionForm.description.trim(),

        is_active:
          collectionForm.is_active,

        product_ids:
          selectedProductIds,
      };

      const url = editingCollection
        ? `${API_BASE}/admin/collections/${editingCollection.id}`
        : `${API_BASE}/admin/collections`;

      const method = editingCollection
        ? "PUT"
        : "POST";

      const response = await fetch(url, {
        method,
        headers: authHeaders,
        body: JSON.stringify(payload),
      });

      const data =
        await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Failed to save collection."
        );
      }

      setSuccess(
        editingCollection
          ? "Collection updated successfully."
          : "Collection created successfully."
      );

      closeCollectionModal();

      await loadData();
    } catch (err) {
      console.error(
        "Save collection error:",
        err
      );

      setError(
        err.message ||
          "Failed to save collection."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleCollectionStatus = async (
    collection
  ) => {
    try {
      setError("");
      setSuccess("");

      const response = await fetch(
        `${API_BASE}/admin/collections/${collection.id}/status`,
        {
          method: "PATCH",
          headers: authHeaders,
          body: JSON.stringify({
            is_active:
              !collection.is_active,
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Failed to update collection status."
        );
      }

      setSuccess(
        collection.is_active
          ? "Collection deactivated."
          : "Collection activated."
      );

      await loadData();
    } catch (err) {
      console.error(
        "Collection status error:",
        err
      );

      setError(
        err.message ||
          "Failed to update collection status."
      );
    }
  };

  const handleDeleteCollection = async (
    collection
  ) => {
    const confirmed =
      window.confirm(
        `Delete collection "${collection.name}"?`
      );

    if (!confirmed) {
      return;
    }

    try {
      setError("");
      setSuccess("");

      const response = await fetch(
        `${API_BASE}/admin/collections/${collection.id}`,
        {
          method: "DELETE",
          headers: authHeaders,
        }
      );

      const data =
        await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Failed to delete collection."
        );
      }

      setSuccess(
        "Collection deleted successfully."
      );

      await loadData();
    } catch (err) {
      console.error(
        "Delete collection error:",
        err
      );

      setError(
        err.message ||
          "Failed to delete collection."
      );
    }
  };

  // =====================================================
  // GIFT SET MODAL
  // =====================================================

  const openCreateGiftSet = () => {
    setEditingGiftSet(null);

    setGiftSetForm({
      ...emptyGiftSet,
      items: [],
    });

    setGiftSetImageFile(null);
    setVariantSearch("");

    setError("");
    setSuccess("");

    setGiftSetModal(true);
  };

  const handleEditGiftSet = async (
    giftSet
  ) => {
    try {
      setError("");

      const response = await fetch(
        `${API_BASE}/admin/gift-sets/${giftSet.id}`,
        {
          headers: authHeaders,
        }
      );

      const data =
        await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Failed to load gift set."
        );
      }

      const item =
        data.giftSet ||
        data.data?.giftSet ||
        data.data;

      setEditingGiftSet(item);

      setGiftSetForm({
        name: item?.name || "",

        description:
          item?.description || "",

        selling_price:
          item?.selling_price ?? "",

        mrp: item?.mrp ?? "",

        image_url:
          item?.image_url || "",

        stock_quantity:
          item?.stock_quantity ?? 0,

        is_active:
          item?.is_active !== false,

        items: (item?.items || []).map(
          (giftItem) => ({
            id: giftItem.id,

            product_variant_id:
              Number(
                giftItem.product_variant_id
              ),

            product_id:
              giftItem.product_id
                ? Number(
                    giftItem.product_id
                  )
                : null,

            quantity: Number(
              giftItem.quantity || 1
            ),

            product_name:
              giftItem.product_name ||
              "Wine",

            bottle_size:
              giftItem.bottle_size ||
              "",

            sku:
              giftItem.sku || "",

            variant_stock_quantity:
              giftItem.variant_stock_quantity ??
              null,
          })
        ),
      });

      setGiftSetImageFile(null);
      setVariantSearch("");

      setGiftSetModal(true);
    } catch (err) {
      console.error(
        "Gift set edit error:",
        err
      );

      setError(
        err.message ||
          "Failed to load gift set."
      );
    }
  };

  const addVariantToGiftSet = (
    variant
  ) => {
    const variantId = Number(
      variant.id
    );

    const exists =
      giftSetForm.items.some(
        (item) =>
          Number(
            item.product_variant_id
          ) === variantId
      );

    if (exists) {
      setError(
        "This wine variant is already added."
      );
      return;
    }

    setGiftSetForm((prev) => ({
      ...prev,

      items: [
        ...prev.items,
        {
          product_variant_id:
            variantId,

          product_id:
            Number(variant.product_id),

          quantity: 1,

          product_name:
            variant.product_name,

          bottle_size:
            variant.bottle_size || "",

          sku:
            variant.sku || "",

          variant_stock_quantity:
            variant.stock_quantity ??
            variant.stockQuantity ??
            null,
        },
      ],
    }));

    setError("");
  };

  const updateGiftSetItemQuantity = (
    variantId,
    quantity
  ) => {
    const safeQuantity = Math.max(
      1,
      Number(quantity) || 1
    );

    setGiftSetForm((prev) => ({
      ...prev,

      items: prev.items.map((item) =>
        Number(
          item.product_variant_id
        ) === Number(variantId)
          ? {
              ...item,
              quantity:
                safeQuantity,
            }
          : item
      ),
    }));
  };

  const removeGiftSetItem = (
    variantId
  ) => {
    setGiftSetForm((prev) => ({
      ...prev,

      items: prev.items.filter(
        (item) =>
          Number(
            item.product_variant_id
          ) !== Number(variantId)
      ),
    }));
  };

  // =====================================================
  // GIFT SET IMAGE UPLOAD
  // =====================================================

  const uploadGiftSetImage = async (
    file
  ) => {
    const formData = new FormData();

    formData.append("image", file);

    /*
     * IMPORTANT:
     *
     * Your current adminUploadRoutes.js has:
     *
     * router.post(
     *   "/product-image",
     *   uploadProductImage
     * );
     *
     * Therefore the correct endpoint here is:
     *
     * /admin/uploads/product-image
     */

    const uploadResponse =
      await fetch(
        `${API_BASE}/admin/uploads/product-image`,
        {
          method: "POST",

          headers: {
            Authorization:
              `Bearer ${token}`,
          },

          body: formData,
        }
      );

    const uploadData =
      await uploadResponse.json();

    if (
      !uploadResponse.ok ||
      !uploadData.success
    ) {
      throw new Error(
        uploadData.message ||
          "Failed to upload gift set image."
      );
    }

    /*
     * Your controller returns:
     *
     * imageUrl
     *
     * not image_url.
     */

    return (
      uploadData.imageUrl ||
      uploadData.image_url ||
      ""
    );
  };

  // =====================================================
  // SAVE GIFT SET
  // =====================================================

  const handleSaveGiftSet = async (
    event
  ) => {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const name =
        giftSetForm.name.trim();

      if (!name) {
        throw new Error(
          "Gift set name is required."
        );
      }

      /*
       * A gift set must contain at least
       * two different products/wines.
       */

      if (
        giftSetForm.items.length < 2
      ) {
        throw new Error(
          "A gift set must contain at least 2 different wines."
        );
      }

      const productIds =
        giftSetForm.items
          .map((item) =>
            Number(
              item.product_id || 0
            )
          )
          .filter(Boolean);

      const uniqueProductIds =
        new Set(productIds);

      if (
        uniqueProductIds.size < 2
      ) {
        throw new Error(
          "A gift set must contain at least 2 different wines."
        );
      }

      const mrp = Number(
        giftSetForm.mrp || 0
      );

      const sellingPrice = Number(
        giftSetForm.selling_price || 0
      );

      const stockQuantity = Number(
        giftSetForm.stock_quantity || 0
      );

      if (
        mrp < 0 ||
        sellingPrice < 0
      ) {
        throw new Error(
          "Prices cannot be negative."
        );
      }

      if (
        sellingPrice > mrp &&
        mrp > 0
      ) {
        throw new Error(
          "Selling price cannot be greater than MRP."
        );
      }

      if (stockQuantity < 0) {
        throw new Error(
          "Stock quantity cannot be negative."
        );
      }

      let imageUrl =
        giftSetForm.image_url || "";

      // -------------------------------------------------
      // UPLOAD NEW IMAGE IF SELECTED
      // -------------------------------------------------

      if (giftSetImageFile) {
        imageUrl =
          await uploadGiftSetImage(
            giftSetImageFile
          );
      }

      // -------------------------------------------------
      // SAVE GIFT SET
      // -------------------------------------------------

      const payload = {
        name,

        description:
          giftSetForm.description.trim(),

        selling_price:
          sellingPrice,

        mrp,

        image_url:
          imageUrl,

        stock_quantity:
          stockQuantity,

        is_active:
          giftSetForm.is_active,

        items:
          giftSetForm.items.map(
            (item) => ({
              product_variant_id:
                Number(
                  item.product_variant_id
                ),

              quantity: Math.max(
                1,
                Number(
                  item.quantity || 1
                )
              ),
            })
          ),
      };

      const url =
        editingGiftSet
          ? `${API_BASE}/admin/gift-sets/${editingGiftSet.id}`
          : `${API_BASE}/admin/gift-sets`;

      const method =
        editingGiftSet
          ? "PUT"
          : "POST";

      const response =
        await fetch(url, {
          method,
          headers: authHeaders,
          body: JSON.stringify(
            payload
          ),
        });

      const data =
        await response.json();

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.message ||
            "Failed to save gift set."
        );
      }

      setSuccess(
        editingGiftSet
          ? "Gift set updated successfully."
          : "Gift set created successfully."
      );

      setGiftSetModal(false);
      setEditingGiftSet(null);

      setGiftSetForm({
        ...emptyGiftSet,
        items: [],
      });

      setGiftSetImageFile(null);
      setVariantSearch("");

      await loadData();
    } catch (err) {
      console.error(
        "Save gift set error:",
        err
      );

      setError(
        err.message ||
          "Failed to save gift set."
      );
    } finally {
      setSaving(false);
    }
  };

  // =====================================================
  // GIFT SET STATUS
  // =====================================================

  const handleGiftSetStatus = async (
    giftSet
  ) => {
    try {
      setError("");
      setSuccess("");

      const response = await fetch(
        `${API_BASE}/admin/gift-sets/${giftSet.id}/status`,
        {
          method: "PATCH",
          headers: authHeaders,
          body: JSON.stringify({
            is_active:
              !giftSet.is_active,
          }),
        }
      );

      const data =
        await response.json();

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.message ||
            "Failed to update gift set status."
        );
      }

      setSuccess(
        giftSet.is_active
          ? "Gift set deactivated."
          : "Gift set activated."
      );

      await loadData();
    } catch (err) {
      console.error(
        "Gift set status error:",
        err
      );

      setError(
        err.message ||
          "Failed to update gift set status."
      );
    }
  };

  // =====================================================
  // DELETE GIFT SET
  // =====================================================

  const handleDeleteGiftSet = async (
    giftSet
  ) => {
    const confirmed =
      window.confirm(
        `Delete gift set "${giftSet.name}"?`
      );

    if (!confirmed) {
      return;
    }

    try {
      setError("");
      setSuccess("");

      const response = await fetch(
        `${API_BASE}/admin/gift-sets/${giftSet.id}`,
        {
          method: "DELETE",
          headers: authHeaders,
        }
      );

      const data =
        await response.json();

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.message ||
            "Failed to delete gift set."
        );
      }

      setSuccess(
        "Gift set deleted successfully."
      );

      await loadData();
    } catch (err) {
      console.error(
        "Delete gift set error:",
        err
      );

      setError(
        err.message ||
          "Failed to delete gift set."
      );
    }
  };

  // =====================================================
  // CLOSE COLLECTION MODAL
  // =====================================================

  const closeCollectionModal = () => {
    if (saving) {
      return;
    }

    setCollectionModal(false);
    setEditingCollection(null);

    setCollectionForm({
      ...emptyCollection,
    });

    setSelectedProductIds([]);
    setProductSearch("");
  };

  // =====================================================
  // CLOSE GIFT SET MODAL
  // =====================================================

  const closeGiftSetModal = () => {
    if (saving) {
      return;
    }

    setGiftSetModal(false);
    setEditingGiftSet(null);

    setGiftSetForm({
      ...emptyGiftSet,
      items: [],
    });

    setGiftSetImageFile(null);
    setVariantSearch("");
  };

  // =====================================================
  // UI
  // =====================================================

  return (
    <div className="min-h-screen bg-[#f3e8d7] px-4 py-6 text-[#351716] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">

        {/* =================================================
            HEADER
        ================================================= */}

        <div className="mb-8">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-[#a88342]">
            Catalog Management
          </p>

          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                Collections
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-[#351716]/60">
                Organize wines into curated
                collections and create wine
                gift sets or combos.
              </p>
            </div>

            <button
              type="button"
              onClick={
                activeTab === "collections"
                  ? openCreateCollection
                  : openCreateGiftSet
              }
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#351716] px-5 py-3 text-sm font-semibold text-[#f3e8d7] shadow-sm transition hover:bg-[#4a211f]"
            >
              <Plus size={18} />

              {activeTab === "collections"
                ? "Add Collection"
                : "Add Gift Set"}
            </button>
          </div>
        </div>

        {/* =================================================
            ALERTS
        ================================================= */}

        {error && (
          <div className="mb-6 flex items-start justify-between gap-4 rounded-xl border border-red-900/10 bg-red-50 px-4 py-3 text-sm text-red-900">
            <span>{error}</span>

            <button
              type="button"
              onClick={() =>
                setError("")
              }
              className="shrink-0"
            >
              <X size={17} />
            </button>
          </div>
        )}

        {success && (
          <div className="mb-6 flex items-start justify-between gap-4 rounded-xl border border-green-900/10 bg-green-50 px-4 py-3 text-sm text-green-900">
            <span>{success}</span>

            <button
              type="button"
              onClick={() =>
                setSuccess("")
              }
              className="shrink-0"
            >
              <X size={17} />
            </button>
          </div>
        )}

        {/* =================================================
            TABS
        ================================================= */}

        <div className="mb-7 flex w-full max-w-xl rounded-2xl border border-[#351716]/10 bg-[#f8f1e6] p-1.5 shadow-sm">
          <button
            type="button"
            onClick={() =>
              setActiveTab(
                "collections"
              )
            }
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition ${
              activeTab === "collections"
                ? "bg-[#351716] text-[#f3e8d7] shadow-sm"
                : "text-[#351716]/60 hover:bg-[#351716]/5 hover:text-[#351716]"
            }`}
          >
            <Layers size={17} />
            Wine Collections
          </button>

          <button
            type="button"
            onClick={() =>
              setActiveTab(
                "giftsets"
              )
            }
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition ${
              activeTab === "giftsets"
                ? "bg-[#351716] text-[#f3e8d7] shadow-sm"
                : "text-[#351716]/60 hover:bg-[#351716]/5 hover:text-[#351716]"
            }`}
          >
            <Gift size={17} />
            Gift Sets & Combos
          </button>
        </div>

        {/* =================================================
            LOADING
        ================================================= */}

        {loading ? (
          <div className="rounded-2xl border border-[#351716]/10 bg-[#f8f1e6] px-6 py-16 text-center">
            <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-[#351716]/15 border-t-[#351716]" />

            <p className="text-sm text-[#351716]/60">
              Loading catalog...
            </p>
          </div>
        ) : (
          <>
            {/* =================================================
                COLLECTIONS
            ================================================= */}

            {activeTab ===
              "collections" && (
              <>
                {collections.length ===
                0 ? (
                  <div className="rounded-2xl border border-[#351716]/10 bg-[#f8f1e6] px-6 py-16 text-center shadow-sm">
                    <Layers
                      size={40}
                      className="mx-auto mb-4 text-[#a88342]"
                    />

                    <h2 className="text-xl font-semibold">
                      No Collections Yet
                    </h2>

                    <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#351716]/55">
                      Create a collection
                      and select the wines
                      that should appear
                      inside it.
                    </p>

                    <button
                      type="button"
                      onClick={
                        openCreateCollection
                      }
                      className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#351716] px-5 py-3 text-sm font-semibold text-[#f3e8d7]"
                    >
                      <Plus size={17} />
                      Add Collection
                    </button>
                  </div>
                ) : (
                  <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                    {collections.map(
                      (
                        collection
                      ) => (
                        <div
                          key={
                            collection.id
                          }
                          className="overflow-hidden rounded-2xl border border-[#351716]/10 bg-[#f8f1e6] shadow-sm"
                        >
                          <div className="h-1 bg-[#c9a45c]" />

                          <div className="p-6">
                            <div className="mb-4 flex items-start justify-between gap-3">
                              <div>
                                <h2 className="text-lg font-semibold">
                                  {
                                    collection.name
                                  }
                                </h2>

                                <p className="mt-1 text-xs text-[#351716]/45">
                                  /
                                  {
                                    collection.slug
                                  }
                                </p>
                              </div>

                              <span
                                className={`rounded-full px-3 py-1 text-[11px] font-semibold ${
                                  collection.is_active
                                    ? "bg-green-100 text-green-800"
                                    : "bg-[#351716]/8 text-[#351716]/55"
                                }`}
                              >
                                {collection.is_active
                                  ? "Active"
                                  : "Inactive"}
                              </span>
                            </div>

                            {collection.description && (
                              <p className="mb-5 line-clamp-3 text-sm leading-6 text-[#351716]/60">
                                {
                                  collection.description
                                }
                              </p>
                            )}

                            <div className="mb-5 flex items-center gap-2 text-sm text-[#351716]/65">
                              <Package size={17} />

                              <span>
                                {Number(
                                  collection.product_count ||
                                    0
                                )}{" "}
                                products
                              </span>
                            </div>

                            <div className="flex items-center gap-2 border-t border-[#351716]/8 pt-4">
                              <button
                                type="button"
                                onClick={() =>
                                  handleEditCollection(
                                    collection
                                  )
                                }
                                className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-[#351716]/10 bg-white/40 px-3 py-2.5 text-sm font-medium transition hover:bg-white"
                              >
                                <Pencil
                                  size={16}
                                />
                                Edit
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  handleCollectionStatus(
                                    collection
                                  )
                                }
                                title={
                                  collection.is_active
                                    ? "Deactivate"
                                    : "Activate"
                                }
                                className="rounded-xl border border-[#351716]/10 bg-white/40 p-2.5 transition hover:bg-white"
                              >
                                <Power
                                  size={16}
                                  className={
                                    collection.is_active
                                      ? "text-green-700"
                                      : "text-[#351716]/45"
                                  }
                                />
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  handleDeleteCollection(
                                    collection
                                  )
                                }
                                title="Delete"
                                className="rounded-xl border border-red-900/10 bg-red-50 p-2.5 text-red-800 transition hover:bg-red-100"
                              >
                                <Trash2
                                  size={16}
                                />
                              </button>
                            </div>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                )}
              </>
            )}

            {/* =================================================
                GIFT SETS
            ================================================= */}

            {activeTab ===
              "giftsets" && (
              <>
                {giftSets.length ===
                0 ? (
                  <div className="rounded-2xl border border-[#351716]/10 bg-[#f8f1e6] px-6 py-16 text-center shadow-sm">
                    <Gift
                      size={40}
                      className="mx-auto mb-4 text-[#a88342]"
                    />

                    <h2 className="text-xl font-semibold">
                      No Gift Sets Yet
                    </h2>

                    <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#351716]/55">
                      Create a wine gift
                      set or combo with
                      its own price, stock
                      and included wines.
                    </p>

                    <button
                      type="button"
                      onClick={
                        openCreateGiftSet
                      }
                      className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#351716] px-5 py-3 text-sm font-semibold text-[#f3e8d7]"
                    >
                      <Plus size={17} />
                      Add Gift Set
                    </button>
                  </div>
                ) : (
                  <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                    {giftSets.map(
                      (giftSet) => {
                        const mrp =
                          Number(
                            giftSet.mrp ||
                              0
                          );

                        const sellingPrice =
                          Number(
                            giftSet.selling_price ||
                              0
                          );

                        const discount =
                          getDiscount(
                            mrp,
                            sellingPrice
                          );

                        return (
                          <div
                            key={
                              giftSet.id
                            }
                            className="overflow-hidden rounded-2xl border border-[#351716]/10 bg-[#f8f1e6] shadow-sm"
                          >
                            <div className="h-1 bg-[#c9a45c]" />

                            {giftSet.image_url ? (
                              <div className="h-48 overflow-hidden bg-[#351716]/5">
                                <img
                                  src={getImageUrl(
                                    giftSet.image_url
                                  )}
                                  alt={
                                    giftSet.name
                                  }
                                  className="h-full w-full object-cover"
                                />
                              </div>
                            ) : (
                              <div className="flex h-48 items-center justify-center bg-[#351716]/5">
                                <Gift
                                  size={42}
                                  className="text-[#a88342]"
                                />
                              </div>
                            )}

                            <div className="p-6">
                              <div className="mb-4 flex items-start justify-between gap-3">
                                <h2 className="text-lg font-semibold">
                                  {
                                    giftSet.name
                                  }
                                </h2>

                                <span
                                  className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-semibold ${
                                    giftSet.is_active
                                      ? "bg-green-100 text-green-800"
                                      : "bg-[#351716]/8 text-[#351716]/55"
                                  }`}
                                >
                                  {giftSet.is_active
                                    ? "Active"
                                    : "Inactive"}
                                </span>
                              </div>

                              {giftSet.description && (
                                <p className="mb-5 line-clamp-2 text-sm leading-6 text-[#351716]/60">
                                  {
                                    giftSet.description
                                  }
                                </p>
                              )}

                              <div className="mb-5 grid grid-cols-2 gap-3">
                                <div className="rounded-xl bg-white/45 p-3">
                                  <p className="text-[11px] uppercase tracking-wider text-[#351716]/45">
                                    Combo Price
                                  </p>

                                  <p className="mt-1 font-semibold">
                                    ₹
                                    {sellingPrice.toLocaleString(
                                      "en-IN"
                                    )}
                                  </p>

                                  {mrp >
                                    sellingPrice && (
                                    <p className="mt-0.5 text-xs text-[#351716]/40 line-through">
                                      ₹
                                      {mrp.toLocaleString(
                                        "en-IN"
                                      )}
                                    </p>
                                  )}
                                </div>

                                <div className="rounded-xl bg-white/45 p-3">
                                  <p className="text-[11px] uppercase tracking-wider text-[#351716]/45">
                                    Stock
                                  </p>

                                  <p className="mt-1 font-semibold">
                                    {Number(
                                      giftSet.stock_quantity ||
                                        0
                                    )}
                                  </p>
                                </div>
                              </div>

                              {discount >
                                0 && (
                                <div className="mb-4 inline-flex rounded-full bg-[#c9a45c]/15 px-3 py-1 text-xs font-semibold text-[#7b5a19]">
                                  {
                                    discount
                                  }%
                                  off
                                </div>
                              )}

                              <div className="mb-5 flex items-center gap-2 text-sm text-[#351716]/65">
                                <Package
                                  size={
                                    17
                                  }
                                />

                                <span>
                                  {Number(
                                    giftSet.item_count ||
                                      giftSet.items_count ||
                                      0
                                  )}{" "}
                                  wine
                                  variants
                                </span>
                              </div>

                              <div className="flex items-center gap-2 border-t border-[#351716]/8 pt-4">
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleEditGiftSet(
                                      giftSet
                                    )
                                  }
                                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-[#351716]/10 bg-white/40 px-3 py-2.5 text-sm font-medium transition hover:bg-white"
                                >
                                  <Pencil
                                    size={
                                      16
                                    }
                                  />
                                  Edit
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    handleGiftSetStatus(
                                      giftSet
                                    )
                                  }
                                  title={
                                    giftSet.is_active
                                      ? "Deactivate"
                                      : "Activate"
                                  }
                                  className="rounded-xl border border-[#351716]/10 bg-white/40 p-2.5 transition hover:bg-white"
                                >
                                  <Power
                                    size={
                                      16
                                    }
                                    className={
                                      giftSet.is_active
                                        ? "text-green-700"
                                        : "text-[#351716]/45"
                                    }
                                  />
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    handleDeleteGiftSet(
                                      giftSet
                                    )
                                  }
                                  title="Delete"
                                  className="rounded-xl border border-red-900/10 bg-red-50 p-2.5 text-red-800 transition hover:bg-red-100"
                                >
                                  <Trash2
                                    size={
                                      16
                                    }
                                  />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      }
                    )}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>

      {/* =====================================================
          COLLECTION MODAL
      ===================================================== */}

      {collectionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#351716]/40 p-4 backdrop-blur-sm">
          <div className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl border border-[#351716]/10 bg-[#f8f1e6] shadow-2xl">

            <div className="flex items-center justify-between border-b border-[#351716]/10 px-6 py-5">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#a88342]">
                  Wine Collection
                </p>

                <h2 className="mt-1 text-xl font-semibold">
                  {editingCollection
                    ? "Edit Collection"
                    : "Create Collection"}
                </h2>
              </div>

              <button
                type="button"
                onClick={
                  closeCollectionModal
                }
                className="rounded-xl p-2 text-[#351716]/55 transition hover:bg-[#351716]/5 hover:text-[#351716]"
              >
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={
                handleSaveCollection
              }
              className="overflow-y-auto p-6"
            >
              {/* COLLECTION DETAILS */}

              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold">
                    Collection Name *
                  </label>

                  <input
                    type="text"
                    value={
                      collectionForm.name
                    }
                    onChange={(e) =>
                      handleCollectionNameChange(
                        e.target.value
                      )
                    }
                    placeholder="e.g. Premium Red Wines"
                    className="w-full rounded-xl border border-[#351716]/10 bg-white/65 px-4 py-3 text-sm outline-none transition focus:border-[#c9a45c] focus:ring-2 focus:ring-[#c9a45c]/20"
                    required
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold">
                    Slug
                  </label>

                  <input
                    type="text"
                    value={
                      collectionForm.slug
                    }
                    onChange={(e) =>
                      setCollectionForm(
                        (prev) => ({
                          ...prev,
                          slug:
                            e.target.value,
                        })
                      )
                    }
                    placeholder="premium-red-wines"
                    className="w-full rounded-xl border border-[#351716]/10 bg-white/65 px-4 py-3 text-sm outline-none transition focus:border-[#c9a45c] focus:ring-2 focus:ring-[#c9a45c]/20"
                  />
                </div>
              </div>

              <div className="mt-5">
                <label className="mb-2 block text-sm font-semibold">
                  Description
                </label>

                <textarea
                  value={
                    collectionForm.description
                  }
                  onChange={(e) =>
                    setCollectionForm(
                      (prev) => ({
                        ...prev,
                        description:
                          e.target.value,
                      })
                    )
                  }
                  rows={3}
                  placeholder="Describe this wine collection..."
                  className="w-full resize-none rounded-xl border border-[#351716]/10 bg-white/65 px-4 py-3 text-sm outline-none transition focus:border-[#c9a45c] focus:ring-2 focus:ring-[#c9a45c]/20"
                />
              </div>

              {/* PRODUCTS */}

              <div className="mt-7">
                <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <h3 className="text-sm font-semibold">
                      Products in this Collection
                    </h3>

                    <p className="mt-1 text-xs text-[#351716]/55">
                      Select the wines that
                      should belong to this
                      collection.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-[#c9a45c]/15 px-3 py-1 text-xs font-semibold text-[#7b5a19]">
                      {
                        selectedProductIds.length
                      }{" "}
                      selected
                    </span>

                    {selectedProductIds.length >
                      0 && (
                      <button
                        type="button"
                        onClick={
                          clearSelectedProducts
                        }
                        className="text-xs font-medium text-[#351716]/55 underline underline-offset-2 hover:text-[#351716]"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>

                <div className="relative">
                  <Search
                    size={17}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-[#351716]/35"
                  />

                  <input
                    type="text"
                    value={
                      productSearch
                    }
                    onChange={(e) =>
                      setProductSearch(
                        e.target.value
                      )
                    }
                    placeholder="Search wines by name, winery or type..."
                    className="w-full rounded-xl border border-[#351716]/10 bg-white/65 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-[#c9a45c] focus:ring-2 focus:ring-[#c9a45c]/20"
                  />
                </div>

                <div className="mt-3 flex justify-end">
                  <button
                    type="button"
                    onClick={
                      selectAllVisibleProducts
                    }
                    className="text-xs font-semibold text-[#7b5a19] hover:underline"
                  >
                    Select all visible
                  </button>
                </div>

                <div className="mt-2 max-h-72 overflow-y-auto rounded-2xl border border-[#351716]/10 bg-white/35">
                  {filteredCollectionProducts.length ===
                  0 ? (
                    <div className="px-5 py-10 text-center">
                      <Package
                        size={30}
                        className="mx-auto mb-3 text-[#a88342]"
                      />

                      <p className="text-sm text-[#351716]/55">
                        No products found.
                      </p>
                    </div>
                  ) : (
                    filteredCollectionProducts.map(
                      (product) => {
                        const productId =
                          Number(
                            product.id
                          );

                        const selected =
                          selectedProductIds.includes(
                            productId
                          );

                        const image =
                          getProductImage(
                            product
                          );

                        return (
                          <label
                            key={
                              product.id
                            }
                            className={`flex cursor-pointer items-center gap-3 border-b border-[#351716]/6 px-4 py-3 last:border-b-0 transition ${
                              selected
                                ? "bg-[#c9a45c]/10"
                                : "hover:bg-[#351716]/5"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={
                                selected
                              }
                              onChange={() =>
                                toggleProductSelection(
                                  productId
                                )
                              }
                              className="h-4 w-4 accent-[#351716]"
                            />

                            <div className="h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-[#351716]/5">
                              {image ? (
                                <img
                                  src={getImageUrl(
                                    image
                                  )}
                                  alt={
                                    product.name
                                  }
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center">
                                  <WineIcon />
                                </div>
                              )}
                            </div>

                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-semibold">
                                {
                                  product.name
                                }
                              </p>

                              <p className="mt-0.5 truncate text-xs text-[#351716]/50">
                                {getProductWinery(
                                  product
                                ) ||
                                  "VINEORA Wine"}

                                {getProductType(
                                  product
                                )
                                  ? ` • ${getProductType(
                                      product
                                    )}`
                                  : ""}
                              </p>
                            </div>

                            {selected && (
                              <span className="text-xs font-semibold text-[#7b5a19]">
                                Selected
                              </span>
                            )}
                          </label>
                        );
                      }
                    )
                  )}
                </div>
              </div>

              {/* STATUS */}

              <label className="mt-6 flex cursor-pointer items-center gap-3 rounded-xl border border-[#351716]/10 bg-white/35 px-4 py-3">
                <input
                  type="checkbox"
                  checked={
                    collectionForm.is_active
                  }
                  onChange={(e) =>
                    setCollectionForm(
                      (prev) => ({
                        ...prev,
                        is_active:
                          e.target.checked,
                      })
                    )
                  }
                  className="h-4 w-4 accent-[#351716]"
                />

                <div>
                  <p className="text-sm font-semibold">
                    Active Collection
                  </p>

                  <p className="text-xs text-[#351716]/50">
                    Make this collection
                    visible to customers.
                  </p>
                </div>
              </label>

              {/* FOOTER */}

              <div className="mt-7 flex flex-col-reverse gap-3 border-t border-[#351716]/10 pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={
                    closeCollectionModal
                  }
                  className="rounded-xl border border-[#351716]/10 bg-white/40 px-5 py-3 text-sm font-semibold transition hover:bg-white"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#351716] px-6 py-3 text-sm font-semibold text-[#f3e8d7] transition hover:bg-[#4a211f] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Save size={17} />

                  {saving
                    ? "Saving..."
                    : editingCollection
                    ? "Update Collection"
                    : "Create Collection"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================
          GIFT SET MODAL
      ===================================================== */}

      {giftSetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#351716]/40 p-4 backdrop-blur-sm">
          <div className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl border border-[#351716]/10 bg-[#f8f1e6] shadow-2xl">

            {/* HEADER */}

            <div className="flex items-center justify-between border-b border-[#351716]/10 px-6 py-5">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#a88342]">
                  Gift Sets & Combos
                </p>

                <h2 className="mt-1 text-xl font-semibold">
                  {editingGiftSet
                    ? "Edit Gift Set"
                    : "Create Gift Set"}
                </h2>
              </div>

              <button
                type="button"
                onClick={
                  closeGiftSetModal
                }
                className="rounded-xl p-2 text-[#351716]/55 transition hover:bg-[#351716]/5 hover:text-[#351716]"
              >
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={
                handleSaveGiftSet
              }
              className="overflow-y-auto p-6"
            >
              {/* BASIC DETAILS */}

              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold">
                    Gift Set Name *
                  </label>

                  <input
                    type="text"
                    value={
                      giftSetForm.name
                    }
                    onChange={(e) =>
                      setGiftSetForm(
                        (prev) => ({
                          ...prev,
                          name:
                            e.target.value,
                        })
                      )
                    }
                    placeholder="e.g. Premium Red Wine Collection"
                    className="w-full rounded-xl border border-[#351716]/10 bg-white/65 px-4 py-3 text-sm outline-none transition focus:border-[#c9a45c] focus:ring-2 focus:ring-[#c9a45c]/20"
                    required
                  />
                </div>

                {/* IMAGE */}

                <div>
                  <label className="mb-2 block text-sm font-semibold">
                    Gift Set Image
                  </label>

                  <div className="rounded-xl border border-[#351716]/10 bg-white/65 p-4">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">

                      <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#351716]/5">
                        {giftSetImageFile ? (
                          <img
                            src={URL.createObjectURL(
                              giftSetImageFile
                            )}
                            alt="Gift set preview"
                            className="h-full w-full object-cover"
                          />
                        ) : giftSetForm.image_url ? (
                          <img
                            src={getImageUrl(
                              giftSetForm.image_url
                            )}
                            alt="Current gift set"
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <ImageIcon
                            size={30}
                            className="text-[#a88342]"
                          />
                        )}
                      </div>

                      <div className="flex-1">
                        <input
                          type="file"
                          accept="image/jpeg,image/jpg,image/png,image/webp"
                          onChange={(e) => {
                            const file =
                              e.target.files?.[0] ||
                              null;

                            if (!file) {
                              return;
                            }

                            if (
                              file.size >
                              5 *
                                1024 *
                                1024
                            ) {
                              setError(
                                "Image must be 5MB or smaller."
                              );

                              e.target.value =
                                "";

                              return;
                            }

                            setGiftSetImageFile(
                              file
                            );

                            setError("");
                          }}
                          className="block w-full text-sm text-[#351716]/65 file:mr-4 file:rounded-lg file:border-0 file:bg-[#351716] file:px-4 file:py-2.5 file:text-sm file:font-semibold file:text-[#f3e8d7] hover:file:bg-[#4a211f]"
                        />

                        <p className="mt-2 text-xs text-[#351716]/50">
                          JPG, PNG or WEBP.
                          Maximum size:
                          5MB.
                        </p>

                        {giftSetImageFile && (
                          <p className="mt-2 text-xs font-medium text-green-800">
                            Selected:{" "}
                            {
                              giftSetImageFile.name
                            }
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* DESCRIPTION */}

              <div className="mt-5">
                <label className="mb-2 block text-sm font-semibold">
                  Description
                </label>

                <textarea
                  value={
                    giftSetForm.description
                  }
                  onChange={(e) =>
                    setGiftSetForm(
                      (prev) => ({
                        ...prev,
                        description:
                          e.target.value,
                      })
                    )
                  }
                  rows={3}
                  placeholder="Describe the gift set or combo..."
                  className="w-full resize-none rounded-xl border border-[#351716]/10 bg-white/65 px-4 py-3 text-sm outline-none transition focus:border-[#c9a45c] focus:ring-2 focus:ring-[#c9a45c]/20"
                />
              </div>

              {/* PRICE / STOCK */}

              <div className="mt-5 grid gap-4 sm:grid-cols-3">
                <div>
                  <label className="mb-2 block text-sm font-semibold">
                    MRP
                  </label>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={
                      giftSetForm.mrp
                    }
                    onChange={(e) =>
                      setGiftSetForm(
                        (prev) => ({
                          ...prev,
                          mrp:
                            e.target.value,
                        })
                      )
                    }
                    placeholder="0.00"
                    className="w-full rounded-xl border border-[#351716]/10 bg-white/65 px-4 py-3 text-sm outline-none transition focus:border-[#c9a45c] focus:ring-2 focus:ring-[#c9a45c]/20"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold">
                    Combo Selling Price
                  </label>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={
                      giftSetForm.selling_price
                    }
                    onChange={(e) =>
                      setGiftSetForm(
                        (prev) => ({
                          ...prev,
                          selling_price:
                            e.target.value,
                        })
                      )
                    }
                    placeholder="0.00"
                    className="w-full rounded-xl border border-[#351716]/10 bg-white/65 px-4 py-3 text-sm outline-none transition focus:border-[#c9a45c] focus:ring-2 focus:ring-[#c9a45c]/20"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold">
                    Combo Stock
                  </label>

                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={
                      giftSetForm.stock_quantity
                    }
                    onChange={(e) =>
                      setGiftSetForm(
                        (prev) => ({
                          ...prev,
                          stock_quantity:
                            e.target.value,
                        })
                      )
                    }
                    className="w-full rounded-xl border border-[#351716]/10 bg-white/65 px-4 py-3 text-sm outline-none transition focus:border-[#c9a45c] focus:ring-2 focus:ring-[#c9a45c]/20"
                  />
                </div>
              </div>

              {/* ACTIVE */}

              <label className="mt-5 flex cursor-pointer items-center gap-3 rounded-xl border border-[#351716]/10 bg-white/35 px-4 py-3">
                <input
                  type="checkbox"
                  checked={
                    giftSetForm.is_active
                  }
                  onChange={(e) =>
                    setGiftSetForm(
                      (prev) => ({
                        ...prev,
                        is_active:
                          e.target.checked,
                      })
                    )
                  }
                  className="h-4 w-4 accent-[#351716]"
                />

                <div>
                  <p className="text-sm font-semibold">
                    Active Gift Set
                  </p>

                  <p className="text-xs text-[#351716]/50">
                    Make this gift set
                    available on the
                    storefront.
                  </p>
                </div>
              </label>

              {/* INCLUDED WINES */}

              <div className="mt-7">
                <div className="mb-3">
                  <h3 className="text-sm font-semibold">
                    Included Wines
                  </h3>

                  <p className="mt-1 text-xs text-[#351716]/55">
                    Add product variants
                    and set how many
                    bottles are included.
                  </p>
                </div>

                {/* SELECTED ITEMS */}

                {giftSetForm.items.length >
                  0 && (
                  <div className="mb-5 space-y-2">
                    {giftSetForm.items.map(
                      (item) => (
                        <div
                          key={
                            item.product_variant_id
                          }
                          className="flex flex-col gap-3 rounded-xl border border-[#351716]/10 bg-white/45 p-3 sm:flex-row sm:items-center"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold">
                              {
                                item.product_name
                              }
                            </p>

                            <p className="mt-0.5 text-xs text-[#351716]/50">
                              {item.bottle_size ||
                                "Standard"}

                              {item.sku
                                ? ` • ${item.sku}`
                                : ""}
                            </p>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                updateGiftSetItemQuantity(
                                  item.product_variant_id,
                                  Number(
                                    item.quantity ||
                                      1
                                  ) - 1
                                )
                              }
                              className="rounded-lg border border-[#351716]/10 bg-white p-2"
                            >
                              <Minus
                                size={
                                  14
                                }
                              />
                            </button>

                            <input
                              type="number"
                              min="1"
                              value={
                                item.quantity
                              }
                              onChange={(
                                e
                              ) =>
                                updateGiftSetItemQuantity(
                                  item.product_variant_id,
                                  e.target.value
                                )
                              }
                              className="w-16 rounded-lg border border-[#351716]/10 bg-white px-2 py-2 text-center text-sm outline-none focus:border-[#c9a45c]"
                            />

                            <button
                              type="button"
                              onClick={() =>
                                updateGiftSetItemQuantity(
                                  item.product_variant_id,
                                  Number(
                                    item.quantity ||
                                      1
                                  ) + 1
                                )
                              }
                              className="rounded-lg border border-[#351716]/10 bg-white p-2"
                            >
                              <Plus
                                size={
                                  14
                                }
                              />
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                removeGiftSetItem(
                                  item.product_variant_id
                                )
                              }
                              className="ml-1 rounded-lg border border-red-900/10 bg-red-50 p-2 text-red-800"
                            >
                              <Trash2
                                size={
                                  15
                                }
                              />
                            </button>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                )}

                {/* VARIANT SEARCH */}

                <div className="relative">
                  <Search
                    size={17}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-[#351716]/35"
                  />

                  <input
                    type="text"
                    value={
                      variantSearch
                    }
                    onChange={(e) =>
                      setVariantSearch(
                        e.target.value
                      )
                    }
                    placeholder="Search wine or bottle size..."
                    className="w-full rounded-xl border border-[#351716]/10 bg-white/65 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-[#c9a45c] focus:ring-2 focus:ring-[#c9a45c]/20"
                  />
                </div>

                {/* VARIANT LIST */}

                <div className="mt-3 max-h-64 overflow-y-auto rounded-2xl border border-[#351716]/10 bg-white/35">
                  {filteredVariants.length ===
                  0 ? (
                    <div className="px-5 py-10 text-center">
                      <Gift
                        size={30}
                        className="mx-auto mb-3 text-[#a88342]"
                      />

                      <p className="text-sm text-[#351716]/55">
                        No wine variants
                        found.
                      </p>
                    </div>
                  ) : (
                    filteredVariants.map(
                      (variant) => {
                        const alreadyAdded =
                          giftSetForm.items.some(
                            (item) =>
                              Number(
                                item.product_variant_id
                              ) ===
                              Number(
                                variant.id
                              )
                          );

                        return (
                          <div
                            key={
                              variant.id
                            }
                            className="flex items-center gap-3 border-b border-[#351716]/6 px-4 py-3 last:border-b-0"
                          >
                            <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-[#351716]/5">
                              {variant.product_image ? (
                                <img
                                  src={getImageUrl(
                                    variant.product_image
                                  )}
                                  alt={
                                    variant.product_name
                                  }
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center">
                                  <WineIcon />
                                </div>
                              )}
                            </div>

                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-semibold">
                                {
                                  variant.product_name
                                }
                              </p>

                              <p className="mt-0.5 truncate text-xs text-[#351716]/50">
                                {getVariantLabel(
                                  variant
                                )}
                              </p>
                            </div>

                            <button
                              type="button"
                              disabled={
                                alreadyAdded
                              }
                              onClick={() =>
                                addVariantToGiftSet(
                                  variant
                                )
                              }
                              className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition ${
                                alreadyAdded
                                  ? "cursor-not-allowed bg-[#351716]/5 text-[#351716]/35"
                                  : "bg-[#351716] text-[#f3e8d7] hover:bg-[#4a211f]"
                              }`}
                            >
                              {alreadyAdded ? (
                                "Added"
                              ) : (
                                <>
                                  <Plus
                                    size={
                                      14
                                    }
                                  />
                                  Add
                                </>
                              )}
                            </button>
                          </div>
                        );
                      }
                    )
                  )}
                </div>
              </div>

              {/* FOOTER */}

              <div className="mt-7 flex flex-col-reverse gap-3 border-t border-[#351716]/10 pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={
                    closeGiftSetModal
                  }
                  className="rounded-xl border border-[#351716]/10 bg-white/40 px-5 py-3 text-sm font-semibold transition hover:bg-white"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#351716] px-6 py-3 text-sm font-semibold text-[#f3e8d7] transition hover:bg-[#4a211f] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Save size={17} />

                  {saving
                    ? "Saving..."
                    : editingGiftSet
                    ? "Update Gift Set"
                    : "Create Gift Set"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// =====================================================
// FALLBACK WINE ICON
// =====================================================

function WineIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      className="h-5 w-5 text-[#a88342]"
    >
      <path d="M8 3h8l-1 7a3 3 0 0 1-6 0L8 3Z" />
      <path d="M12 13v7" />
      <path d="M8 21h8" />
    </svg>
  );
}

export default Collections;