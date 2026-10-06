import { useEffect, useMemo, useState } from "react";
import {
  Search,
  Plus,
  Pencil,
  Power,
  X,
  Upload,
  Image as ImageIcon,
  RefreshCw,
  Package,
} from "lucide-react";

import { useAdminAuth } from "../context/AdminAuthContext";

import {
  getAdminProducts,
  createAdminProduct,
  updateAdminProduct,
  deleteAdminProduct,
  activateAdminProduct,
  uploadProductImage,
} from "../services/api";

import ProductVariants from "../components/ProductVariants";

const API_SERVER_URL = "http://localhost:5000";

/* =========================================================
   INITIAL FORM
========================================================= */

const emptyForm = {
  name: "",
  description: "",
  category_id: "",
  image_url: "",

  vintage: "",
  alcohol_percentage: "",
  region: "",
  country: "",
  grape_variety: "",

  tasting_notes: "",
  aroma: "",
  taste_profile: "",

  body: "",
  sweetness: "",
  acidity: "",

  food_pairing: "",
  serving_temperature: "",
  storage_instructions: "",

  winery_story: "",
  awards_certifications: "",

  bottle_size: "750ml",
  sku: "",
  mrp: "",
  selling_price: "",
  stock_quantity: "",
};

/* =========================================================
   IMAGE URL HELPER
========================================================= */

const getImageUrl = (imageUrl) => {
  if (!imageUrl) return "";

  if (
    imageUrl.startsWith("http://") ||
    imageUrl.startsWith("https://")
  ) {
    return imageUrl;
  }

  return `${API_SERVER_URL}${imageUrl}`;
};

/* =========================================================
   PRODUCTS
========================================================= */

const Products = () => {
  const { token } = useAdminAuth();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  /* VARIANTS */

  const [variantsProduct, setVariantsProduct] = useState(null);

  const [form, setForm] = useState(emptyForm);

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");

  /* =======================================================
     LOAD PRODUCTS
  ======================================================= */

  const loadProducts = async () => {
    try {
      setLoading(true);

      const response = await getAdminProducts(token);

      if (response.success) {
        setProducts(response.products || []);
      }
    } catch (error) {
      console.error("Failed to load products:", error);

      alert(
        error.message || "Failed to load products"
      );
    } finally {
      setLoading(false);
    }
  };

  /* =======================================================
     LOAD CATEGORIES
  ======================================================= */

  const loadCategories = async () => {
    try {
      const response = await fetch(
        `${API_SERVER_URL}/api/categories`
      );

      const data = await response.json();

      if (data.success) {
        setCategories(data.categories || []);
      }
    } catch (error) {
      console.error(
        "Failed to load categories:",
        error
      );
    }
  };

  /* =======================================================
     INITIAL LOAD
  ======================================================= */

  useEffect(() => {
    if (token) {
      loadProducts();
      loadCategories();
    }
  }, [token]);

  /* =======================================================
     FILTER
  ======================================================= */

  const filteredProducts = useMemo(() => {
    const searchValue = search
      .trim()
      .toLowerCase();

    return products.filter((product) => {
      const matchesSearch =
        !searchValue ||
        product.name
          ?.toLowerCase()
          .includes(searchValue) ||
        product.category_name
          ?.toLowerCase()
          .includes(searchValue) ||
        product.country
          ?.toLowerCase()
          .includes(searchValue) ||
        product.region
          ?.toLowerCase()
          .includes(searchValue) ||
        product.grape_variety
          ?.toLowerCase()
          .includes(searchValue);

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" &&
          product.is_active) ||
        (statusFilter === "inactive" &&
          !product.is_active);

      return matchesSearch && matchesStatus;
    });
  }, [products, search, statusFilter]);

  /* =======================================================
     ADD PRODUCT
  ======================================================= */

  const openAddModal = () => {
    setEditingProduct(null);
    setForm(emptyForm);

    setImageFile(null);
    setImagePreview("");

    setModalOpen(true);
  };

  /* =======================================================
     EDIT PRODUCT
  ======================================================= */

  const openEditModal = (product) => {
    setEditingProduct(product);

    const variant =
      product.variants?.[0] || {};

    setForm({
      name: product.name || "",
      description: product.description || "",
      category_id:
        product.category_id || "",
      image_url:
        product.image_url || "",

      vintage:
        product.vintage || "",

      alcohol_percentage:
        product.alcohol_percentage || "",

      region:
        product.region || "",

      country:
        product.country || "",

      grape_variety:
        product.grape_variety || "",

      tasting_notes:
        product.tasting_notes || "",

      aroma:
        product.aroma || "",

      taste_profile:
        product.taste_profile || "",

      body:
        product.body || "",

      sweetness:
        product.sweetness || "",

      acidity:
        product.acidity || "",

      food_pairing:
        product.food_pairing || "",

      serving_temperature:
        product.serving_temperature || "",

      storage_instructions:
        product.storage_instructions || "",

      winery_story:
        product.winery_story || "",

      awards_certifications:
        product.awards_certifications || "",

      bottle_size:
        variant.bottle_size || "750ml",

      sku:
        variant.sku || "",

      mrp:
        variant.mrp ?? "",

      selling_price:
        variant.selling_price ?? "",

      stock_quantity:
        variant.stock_quantity ?? "",
    });

    setImageFile(null);

    if (product.image_url) {
      setImagePreview(
        getImageUrl(product.image_url)
      );
    } else {
      setImagePreview("");
    }

    setModalOpen(true);
  };

  /* =======================================================
     CLOSE PRODUCT MODAL
  ======================================================= */

  const closeModal = () => {
    if (saving) return;

    setModalOpen(false);
    setEditingProduct(null);

    setForm(emptyForm);

    setImageFile(null);
    setImagePreview("");
  };

  /* =======================================================
     FORM CHANGE
  ======================================================= */

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  /* =======================================================
     IMAGE
  ======================================================= */

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.type)) {
      alert(
        "Please select JPG, JPEG, PNG or WEBP."
      );

      event.target.value = "";

      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("Image must be smaller than 5 MB.");

      event.target.value = "";

      return;
    }

    setImageFile(file);

    const previewUrl =
      URL.createObjectURL(file);

    setImagePreview(previewUrl);
  };

  /* =======================================================
     SAVE PRODUCT
  ======================================================= */

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.name.trim()) {
      alert("Product name is required.");
      return;
    }

    if (!form.category_id) {
      alert("Please select a category.");
      return;
    }

    if (!form.bottle_size.trim()) {
      alert("Bottle size is required.");
      return;
    }

    if (!form.sku.trim()) {
      alert("SKU is required.");
      return;
    }

    if (
      form.mrp === "" ||
      Number(form.mrp) < 0
    ) {
      alert("Please enter a valid MRP.");
      return;
    }

    if (
      form.selling_price === "" ||
      Number(form.selling_price) < 0
    ) {
      alert(
        "Please enter a valid selling price."
      );
      return;
    }

    if (
      form.stock_quantity === "" ||
      Number(form.stock_quantity) < 0
    ) {
      alert(
        "Please enter a valid stock quantity."
      );
      return;
    }

    if (
      Number(form.selling_price) >
      Number(form.mrp)
    ) {
      alert(
        "Selling price cannot be greater than MRP."
      );
      return;
    }

    try {
      setSaving(true);

      let imageUrl =
        form.image_url || "";

      /* Upload image */

      if (imageFile) {
        const uploadResponse =
          await uploadProductImage(
            token,
            imageFile
          );

        imageUrl =
          uploadResponse.imageUrl;
      }

      /* Product data */

      const productData = {
        name: form.name.trim(),

        description:
          form.description.trim(),

        category_id:
          Number(form.category_id),

        image_url:
          imageUrl || null,

        vintage: form.vintage
          ? Number(form.vintage)
          : null,

        alcohol_percentage:
          form.alcohol_percentage
            ? Number(
                form.alcohol_percentage
              )
            : null,

        region:
          form.region.trim() || null,

        country:
          form.country.trim() || null,

        grape_variety:
          form.grape_variety.trim() ||
          null,

        tasting_notes:
          form.tasting_notes.trim() ||
          null,

        aroma:
          form.aroma.trim() || null,

        taste_profile:
          form.taste_profile.trim() ||
          null,

        body:
          form.body.trim() || null,

        sweetness:
          form.sweetness.trim() || null,

        acidity:
          form.acidity.trim() || null,

        food_pairing:
          form.food_pairing.trim() ||
          null,

        serving_temperature:
          form.serving_temperature.trim() ||
          null,

        storage_instructions:
          form.storage_instructions.trim() ||
          null,

        winery_story:
          form.winery_story.trim() ||
          null,

        awards_certifications:
          form.awards_certifications.trim() ||
          null,

        /* Variant */

        bottle_size:
          form.bottle_size.trim(),

        sku:
          form.sku.trim(),

        mrp:
          Number(form.mrp),

        selling_price:
          Number(form.selling_price),

        stock_quantity:
          Number(form.stock_quantity),
      };

      if (editingProduct) {
        await updateAdminProduct(
          token,
          editingProduct.id,
          productData
        );
      } else {
        await createAdminProduct(
          token,
          productData
        );
      }

      await loadProducts();

      closeModal();
    } catch (error) {
      console.error(
        "Product save error:",
        error
      );

      alert(
        error.message ||
          "Failed to save product. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  /* =======================================================
     STATUS
  ======================================================= */

  const handleToggleStatus = async (
    product
  ) => {
    const action = product.is_active
      ? "deactivate"
      : "activate";

    const confirmed =
      window.confirm(
        `Are you sure you want to ${action} "${product.name}"?`
      );

    if (!confirmed) return;

    try {
      if (product.is_active) {
        await deleteAdminProduct(
          token,
          product.id
        );
      } else {
        await activateAdminProduct(
          token,
          product.id
        );
      }

      await loadProducts();
    } catch (error) {
      console.error(
        "Status update error:",
        error
      );

      alert(
        error.message ||
          "Failed to update product status."
      );
    }
  };

  /* =======================================================
     MANAGE VARIANTS
  ======================================================= */

  const openVariants = (product) => {
    setVariantsProduct(product);
  };

  const closeVariants = () => {
    setVariantsProduct(null);
  };

  /* =======================================================
     CLASSES
  ======================================================= */

  const inputClass =
    "w-full rounded-xl border border-[#d9cbb9] bg-[#fffdf9] px-4 py-3 text-sm text-[#351716] outline-none transition placeholder:text-[#a69487] focus:border-[#a88342] focus:ring-2 focus:ring-[#c9a45c]/20";

  const labelClass =
    "mb-2 block text-[11px] font-semibold uppercase tracking-[0.15em] text-[#6c5850]";

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="min-h-screen bg-[#f5eee4] px-4 py-6 text-[#351716] sm:px-6 lg:px-8">

      <div className="mx-auto max-w-7xl">

        {/* =================================================
            HEADER
        ================================================= */}

        <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">

          <div>
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.28em] text-[#a88342]">
              VINEORA ADMIN
            </p>

            <h1 className="font-serif text-3xl tracking-wide text-[#351716] sm:text-4xl">
              Products
            </h1>

            <p className="mt-2 max-w-xl text-sm leading-6 text-[#6c5850]">
              Manage your wine catalogue,
              pricing, inventory and storefront
              availability.
            </p>
          </div>

          <div className="flex gap-3">

            <button
              type="button"
              onClick={loadProducts}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#cdbda9] bg-[#fffaf3] px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-[#351716]"
            >
              <RefreshCw size={15} />
              Refresh
            </button>

            <button
              type="button"
              onClick={openAddModal}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#351716] px-5 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-white"
            >
              <Plus size={16} />
              Add Product
            </button>

          </div>
        </div>

        {/* =================================================
            FILTER
        ================================================= */}

        <div className="mb-6 rounded-2xl border border-[#ddcfbe] bg-[#fffaf3] p-4 shadow-sm">

          <div className="flex flex-col gap-3 lg:flex-row">

            <div className="relative flex-1">

              <Search
                size={17}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8b786b]"
              />

              <input
                type="text"
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search products..."
                className={`${inputClass} pl-11`}
              />

            </div>

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(
                  event.target.value
                )
              }
              className={`${inputClass} lg:w-52`}
            >
              <option value="all">
                All Products
              </option>

              <option value="active">
                Active Products
              </option>

              <option value="inactive">
                Inactive Products
              </option>
            </select>

          </div>
        </div>

        {/* =================================================
            PRODUCT LIST
        ================================================= */}

        {loading ? (

          <div className="flex min-h-[300px] items-center justify-center rounded-2xl border border-[#ddcfbe] bg-[#fffaf3]">

            <div className="text-center">

              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-[#c9a45c] border-t-transparent" />

              <p className="mt-4 text-xs uppercase tracking-[0.2em] text-[#6c5850]">
                Loading products
              </p>

            </div>

          </div>

        ) : filteredProducts.length === 0 ? (

          <div className="rounded-2xl border border-[#ddcfbe] bg-[#fffaf3] px-6 py-16 text-center">

            <ImageIcon
              size={35}
              className="mx-auto text-[#b7a38f]"
            />

            <h2 className="mt-4 font-serif text-xl">
              No products found
            </h2>

          </div>

        ) : (

          <>
            {/* =================================================
                DESKTOP
            ================================================= */}

            <div className="hidden overflow-hidden rounded-2xl border border-[#ddcfbe] bg-[#fffaf3] shadow-sm md:block">

              <div className="overflow-x-auto">

                <table className="w-full min-w-[1150px] border-collapse">

                  <thead>

                    <tr className="border-b border-[#ddcfbe] bg-[#f8f0e5] text-left">

                      <th className="px-5 py-4 text-[10px] uppercase tracking-[0.15em]">
                        Product
                      </th>

                      <th className="px-5 py-4 text-[10px] uppercase tracking-[0.15em]">
                        Category
                      </th>

                      <th className="px-5 py-4 text-[10px] uppercase tracking-[0.15em]">
                        Price
                      </th>

                      <th className="px-5 py-4 text-[10px] uppercase tracking-[0.15em]">
                        Stock
                      </th>

                      <th className="px-5 py-4 text-[10px] uppercase tracking-[0.15em]">
                        Status
                      </th>

                      <th className="px-5 py-4 text-right text-[10px] uppercase tracking-[0.15em]">
                        Actions
                      </th>

                    </tr>

                  </thead>

                  <tbody>

                    {filteredProducts.map(
                      (product) => {

                        const variant =
                          product.variants?.[0];

                        return (
                          <tr
                            key={product.id}
                            className="border-b border-[#eadfd2] last:border-b-0"
                          >

                            {/* PRODUCT */}

                            <td className="px-5 py-4">

                              <div className="flex items-center gap-4">

                                <div className="flex h-16 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-[#e0d3c3] bg-[#f8f4ee]">

                                  {product.image_url ? (

                                    <img
                                      src={getImageUrl(
                                        product.image_url
                                      )}
                                      alt={product.name}
                                      className="h-full w-full object-contain"
                                    />

                                  ) : (

                                    <ImageIcon
                                      size={18}
                                      className="text-[#b6a493]"
                                    />

                                  )}

                                </div>

                                <div>

                                  <p className="font-medium">
                                    {product.name}
                                  </p>

                                  <p className="mt-1 text-xs text-[#8a7668]">
                                    {product.grape_variety ||
                                      "Wine product"}
                                  </p>

                                </div>

                              </div>

                            </td>

                            {/* CATEGORY */}

                            <td className="px-5 py-4 text-sm text-[#6c5850]">
                              {product.category_name ||
                                "—"}
                            </td>

                            {/* PRICE */}

                            <td className="px-5 py-4 text-sm">

                              {variant?.selling_price !=
                              null
                                ? `₹${Number(
                                    variant.selling_price
                                  ).toLocaleString(
                                    "en-IN"
                                  )}`
                                : "—"}

                            </td>

                            {/* STOCK */}

                            <td className="px-5 py-4 text-sm">

                              {variant?.stock_quantity ??
                                "—"}

                            </td>

                            {/* STATUS */}

                            <td className="px-5 py-4">

                              {product.is_active ? (

                                <span className="rounded-full bg-[#e7f0e5] px-3 py-1 text-[10px] font-semibold uppercase text-[#42633e]">
                                  Active
                                </span>

                              ) : (

                                <span className="rounded-full bg-[#eee7e2] px-3 py-1 text-[10px] font-semibold uppercase text-[#79695f]">
                                  Inactive
                                </span>

                              )}

                            </td>

                            {/* ACTIONS */}

                            <td className="px-5 py-4">

                              <div className="flex justify-end gap-2">

                                {/* MANAGE VARIANTS */}

                                <button
                                  type="button"
                                  onClick={() =>
                                    openVariants(
                                      product
                                    )
                                  }
                                  title="Manage variants"
                                  className="inline-flex items-center gap-2 rounded-lg border border-[#d9cbbb] px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#5f5049] transition hover:border-[#c9a45c] hover:text-[#351716]"
                                >
                                  <Package
                                    size={14}
                                  />
                                  Variants
                                </button>

                                {/* EDIT */}

                                <button
                                  type="button"
                                  onClick={() =>
                                    openEditModal(
                                      product
                                    )
                                  }
                                  title="Edit product"
                                  className="rounded-lg border border-[#d9cbbb] p-2"
                                >
                                  <Pencil
                                    size={15}
                                  />
                                </button>

                                {/* STATUS */}

                                <button
                                  type="button"
                                  onClick={() =>
                                    handleToggleStatus(
                                      product
                                    )
                                  }
                                  title={
                                    product.is_active
                                      ? "Deactivate product"
                                      : "Activate product"
                                  }
                                  className="rounded-lg border border-[#d9cbbb] p-2"
                                >
                                  <Power
                                    size={15}
                                  />
                                </button>

                              </div>

                            </td>

                          </tr>
                        );
                      }
                    )}

                  </tbody>

                </table>

              </div>

            </div>

            {/* =================================================
                MOBILE
            ================================================= */}

            <div className="space-y-4 md:hidden">

              {filteredProducts.map(
                (product) => {

                  const variant =
                    product.variants?.[0];

                  return (
                    <div
                      key={product.id}
                      className="rounded-2xl border border-[#ddcfbe] bg-[#fffaf3] p-4 shadow-sm"
                    >

                      <div className="flex gap-4">

                        <div className="flex h-28 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[#e0d3c3] bg-[#f8f4ee]">

                          {product.image_url ? (

                            <img
                              src={getImageUrl(
                                product.image_url
                              )}
                              alt={product.name}
                              className="h-full w-full object-contain"
                            />

                          ) : (

                            <ImageIcon
                              size={22}
                              className="text-[#b6a493]"
                            />

                          )}

                        </div>

                        <div className="min-w-0 flex-1">

                          <h2 className="font-medium">
                            {product.name}
                          </h2>

                          <p className="mt-1 text-xs text-[#8a7668]">
                            {product.category_name ||
                              "Wine"}
                          </p>

                          <div className="mt-4 grid grid-cols-2 gap-3 text-xs">

                            <div>

                              <p className="uppercase text-[#9b8879]">
                                Selling Price
                              </p>

                              <p className="mt-1 font-medium">

                                {variant?.selling_price !=
                                null
                                  ? `₹${Number(
                                      variant.selling_price
                                    ).toLocaleString(
                                      "en-IN"
                                    )}`
                                  : "—"}

                              </p>

                            </div>

                            <div>

                              <p className="uppercase text-[#9b8879]">
                                Stock
                              </p>

                              <p className="mt-1 font-medium">
                                {variant?.stock_quantity ??
                                  "—"}
                              </p>

                            </div>

                          </div>

                        </div>

                      </div>

                      {/* MOBILE ACTIONS */}

                      <div className="mt-4 grid grid-cols-3 gap-2 border-t border-[#eadfd2] pt-4">

                        <button
                          type="button"
                          onClick={() =>
                            openVariants(
                              product
                            )
                          }
                          className="flex items-center justify-center gap-1 rounded-xl border border-[#d9cbbb] px-2 py-3 text-[10px] font-semibold uppercase tracking-[0.05em]"
                        >
                          <Package
                            size={13}
                          />
                          Variants
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            openEditModal(
                              product
                            )
                          }
                          className="flex items-center justify-center gap-1 rounded-xl border border-[#d9cbbb] px-2 py-3 text-[10px] font-semibold uppercase tracking-[0.05em]"
                        >
                          <Pencil
                            size={13}
                          />
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            handleToggleStatus(
                              product
                            )
                          }
                          className="flex items-center justify-center gap-1 rounded-xl border border-[#d9cbbb] px-2 py-3 text-[10px] font-semibold uppercase tracking-[0.05em]"
                        >
                          <Power
                            size={13}
                          />
                          {product.is_active
                            ? "Off"
                            : "On"}
                        </button>

                      </div>

                    </div>
                  );
                }
              )}

            </div>
          </>
        )}

        {/* =================================================
            PRODUCT ADD / EDIT MODAL
        ================================================= */}

        {modalOpen && (

          <div className="fixed inset-0 z-50 overflow-y-auto bg-[#241311]/70 p-4 backdrop-blur-sm sm:p-6">

            <div className="flex min-h-full items-center justify-center">

              <div className="w-full max-w-5xl overflow-hidden rounded-3xl border border-[#dfd1c1] bg-[#fffaf3] shadow-2xl">

                {/* HEADER */}

                <div className="flex items-center justify-between border-b border-[#e5d9ca] px-5 py-5 sm:px-7">

                  <div>

                    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#a88342]">
                      VINEORA CATALOGUE
                    </p>

                    <h2 className="mt-1 font-serif text-2xl">
                      {editingProduct
                        ? "Edit Product"
                        : "Add Product"}
                    </h2>

                  </div>

                  <button
                    type="button"
                    onClick={closeModal}
                    className="rounded-full border border-[#d9cbbb] p-2"
                  >
                    <X size={18} />
                  </button>

                </div>

                <form onSubmit={handleSubmit}>

                  <div className="max-h-[72vh] overflow-y-auto px-5 py-6 sm:px-7">

                    <div className="grid gap-6 lg:grid-cols-2">

                      {/* =================================================
                          BASIC
                      ================================================= */}

                      <div className="space-y-5 lg:col-span-2">

                        <h3 className="font-serif text-lg">
                          Basic Information
                        </h3>

                        <div className="grid gap-5 md:grid-cols-2">

                          <div className="md:col-span-2">

                            <label className={labelClass}>
                              Product Name *
                            </label>

                            <input
                              name="name"
                              value={form.name}
                              onChange={handleChange}
                              className={inputClass}
                              placeholder="Angove Nanya Estate Shiraz 2024"
                              required
                            />

                          </div>

                          <div className="md:col-span-2">

                            <label className={labelClass}>
                              Description
                            </label>

                            <textarea
                              name="description"
                              value={
                                form.description
                              }
                              onChange={
                                handleChange
                              }
                              rows={4}
                              className={inputClass}
                            />

                          </div>

                          <div>

                            <label className={labelClass}>
                              Category *
                            </label>

                            <select
                              name="category_id"
                              value={
                                form.category_id
                              }
                              onChange={
                                handleChange
                              }
                              className={
                                inputClass
                              }
                              required
                            >

                              <option value="">
                                Select category
                              </option>

                              {categories.map(
                                (category) => (
                                  <option
                                    key={
                                      category.id
                                    }
                                    value={
                                      category.id
                                    }
                                  >
                                    {
                                      category.name
                                    }
                                  </option>
                                )
                              )}

                            </select>

                          </div>

                          <div>

                            <label className={labelClass}>
                              Vintage
                            </label>

                            <input
                              type="number"
                              name="vintage"
                              value={
                                form.vintage
                              }
                              onChange={
                                handleChange
                              }
                              className={
                                inputClass
                              }
                              placeholder="2024"
                            />

                          </div>

                        </div>

                      </div>

                      {/* =================================================
                          PRICE / INVENTORY
                      ================================================= */}

                      <div className="space-y-5 lg:col-span-2">

                        <div>

                          <h3 className="font-serif text-lg">
                            Pricing & Inventory
                          </h3>

                          <p className="mt-1 text-xs text-[#8a7668]">
                            These values are saved to
                            the product's primary
                            variant.
                          </p>

                        </div>

                        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-5">

                          <div>

                            <label className={labelClass}>
                              Bottle Size *
                            </label>

                            <input
                              name="bottle_size"
                              value={
                                form.bottle_size
                              }
                              onChange={
                                handleChange
                              }
                              className={
                                inputClass
                              }
                              placeholder="750ml"
                              required
                            />

                          </div>

                          <div>

                            <label className={labelClass}>
                              SKU *
                            </label>

                            <input
                              name="sku"
                              value={form.sku}
                              onChange={
                                handleChange
                              }
                              className={
                                inputClass
                              }
                              placeholder="ANG-SHIRAZ-2024-750"
                              required
                            />

                          </div>

                          <div>

                            <label className={labelClass}>
                              MRP *
                            </label>

                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              name="mrp"
                              value={form.mrp}
                              onChange={
                                handleChange
                              }
                              className={
                                inputClass
                              }
                              placeholder="1499"
                              required
                            />

                          </div>

                          <div>

                            <label className={labelClass}>
                              Selling Price *
                            </label>

                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              name="selling_price"
                              value={
                                form.selling_price
                              }
                              onChange={
                                handleChange
                              }
                              className={
                                inputClass
                              }
                              placeholder="1299"
                              required
                            />

                          </div>

                          <div>

                            <label className={labelClass}>
                              Stock Quantity *
                            </label>

                            <input
                              type="number"
                              min="0"
                              name="stock_quantity"
                              value={
                                form.stock_quantity
                              }
                              onChange={
                                handleChange
                              }
                              className={
                                inputClass
                              }
                              placeholder="25"
                              required
                            />

                          </div>

                        </div>

                      </div>

                      {/* =================================================
                          IMAGE
                      ================================================= */}

                      <div className="space-y-5 lg:col-span-2">

                        <h3 className="font-serif text-lg">
                          Product Image
                        </h3>

                        <div className="rounded-2xl border border-[#d9cbbb] bg-[#faf5ed] p-4 sm:p-5">

                          <div className="grid gap-5 md:grid-cols-[220px_1fr]">

                            <div className="flex h-64 items-center justify-center overflow-hidden rounded-2xl border border-[#dfd1c1] bg-white">

                              {imagePreview ? (

                                <img
                                  src={
                                    imagePreview
                                  }
                                  alt="Product preview"
                                  className="h-full w-full object-contain p-3"
                                />

                              ) : (

                                <div className="text-center">

                                  <ImageIcon
                                    size={32}
                                    className="mx-auto text-[#b6a493]"
                                  />

                                  <p className="mt-3 text-xs text-[#8a7668]">
                                    No image selected
                                  </p>

                                </div>

                              )}

                            </div>

                            <div className="flex flex-col justify-center">

                              <p className="text-sm font-medium">
                                Upload product bottle image
                              </p>

                              <p className="mt-2 text-xs leading-5 text-[#8a7668]">
                                JPG, JPEG, PNG or WEBP ·
                                Maximum 5 MB
                              </p>

                              <label className="mt-5 inline-flex w-fit cursor-pointer items-center gap-2 rounded-xl bg-[#351716] px-5 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-white">

                                <Upload size={15} />

                                {imageFile
                                  ? "Change Image"
                                  : "Choose Image"}

                                <input
                                  type="file"
                                  accept="image/jpeg,image/jpg,image/png,image/webp"
                                  className="hidden"
                                  onChange={
                                    handleImageChange
                                  }
                                />

                              </label>

                              {imageFile && (

                                <p className="mt-3 break-all text-xs text-[#6c5850]">
                                  Selected:{" "}
                                  {
                                    imageFile.name
                                  }
                                </p>

                              )}

                            </div>

                          </div>

                        </div>

                      </div>

                      {/* =================================================
                          ORIGIN
                      ================================================= */}

                      <div className="space-y-5">

                        <h3 className="font-serif text-lg">
                          Origin & Composition
                        </h3>

                        <div className="space-y-5">

                          {[
                            [
                              "country",
                              "Country",
                              "Australia",
                            ],
                            [
                              "region",
                              "Region",
                              "South Australia",
                            ],
                            [
                              "grape_variety",
                              "Grape Variety",
                              "Shiraz",
                            ],
                          ].map(
                            ([
                              name,
                              label,
                              placeholder,
                            ]) => (

                              <div key={name}>

                                <label
                                  className={
                                    labelClass
                                  }
                                >
                                  {label}
                                </label>

                                <input
                                  name={name}
                                  value={
                                    form[name]
                                  }
                                  onChange={
                                    handleChange
                                  }
                                  className={
                                    inputClass
                                  }
                                  placeholder={
                                    placeholder
                                  }
                                />

                              </div>

                            )
                          )}

                          <div>

                            <label className={labelClass}>
                              Alcohol %
                            </label>

                            <input
                              type="number"
                              step="0.1"
                              name="alcohol_percentage"
                              value={
                                form.alcohol_percentage
                              }
                              onChange={
                                handleChange
                              }
                              className={
                                inputClass
                              }
                              placeholder="13.2"
                            />

                          </div>

                        </div>

                      </div>

                      {/* =================================================
                          TASTING
                      ================================================= */}

                      <div className="space-y-5">

                        <h3 className="font-serif text-lg">
                          Tasting Profile
                        </h3>

                        {[
                          [
                            "tasting_notes",
                            "Tasting Notes",
                          ],
                          ["aroma", "Aroma"],
                          [
                            "taste_profile",
                            "Taste Profile",
                          ],
                        ].map(
                          ([name, label]) => (

                            <div key={name}>

                              <label
                                className={
                                  labelClass
                                }
                              >
                                {label}
                              </label>

                              <textarea
                                name={name}
                                value={
                                  form[name]
                                }
                                onChange={
                                  handleChange
                                }
                                rows={3}
                                className={
                                  inputClass
                                }
                              />

                            </div>

                          )
                        )}

                      </div>

                      {/* =================================================
                          STYLE
                      ================================================= */}

                      <div className="space-y-5">

                        <h3 className="font-serif text-lg">
                          Wine Style
                        </h3>

                        {[
                          [
                            "body",
                            "Body",
                            "Medium to Full Bodied",
                          ],
                          [
                            "sweetness",
                            "Sweetness",
                            "Dry",
                          ],
                          [
                            "acidity",
                            "Acidity",
                            "Medium",
                          ],
                        ].map(
                          ([
                            name,
                            label,
                            placeholder,
                          ]) => (

                            <div key={name}>

                              <label
                                className={
                                  labelClass
                                }
                              >
                                {label}
                              </label>

                              <input
                                name={name}
                                value={
                                  form[name]
                                }
                                onChange={
                                  handleChange
                                }
                                className={
                                  inputClass
                                }
                                placeholder={
                                  placeholder
                                }
                              />

                            </div>

                          )
                        )}

                      </div>

                      {/* =================================================
                          SERVING
                      ================================================= */}

                      <div className="space-y-5">

                        <h3 className="font-serif text-lg">
                          Serving & Pairing
                        </h3>

                        <div>

                          <label className={labelClass}>
                            Food Pairing
                          </label>

                          <textarea
                            name="food_pairing"
                            value={
                              form.food_pairing
                            }
                            onChange={
                              handleChange
                            }
                            rows={3}
                            className={
                              inputClass
                            }
                          />

                        </div>

                        <div>

                          <label className={labelClass}>
                            Serving Temperature
                          </label>

                          <input
                            name="serving_temperature"
                            value={
                              form.serving_temperature
                            }
                            onChange={
                              handleChange
                            }
                            className={
                              inputClass
                            }
                            placeholder="16–18°C"
                          />

                        </div>

                        <div>

                          <label className={labelClass}>
                            Storage Instructions
                          </label>

                          <textarea
                            name="storage_instructions"
                            value={
                              form.storage_instructions
                            }
                            onChange={
                              handleChange
                            }
                            rows={3}
                            className={
                              inputClass
                            }
                          />

                        </div>

                      </div>

                      {/* =================================================
                          STORY
                      ================================================= */}

                      <div className="space-y-5 lg:col-span-2">

                        <h3 className="font-serif text-lg">
                          Story & Recognition
                        </h3>

                        <div className="grid gap-5 md:grid-cols-2">

                          <div>

                            <label className={labelClass}>
                              Winery Story
                            </label>

                            <textarea
                              name="winery_story"
                              value={
                                form.winery_story
                              }
                              onChange={
                                handleChange
                              }
                              rows={4}
                              className={
                                inputClass
                              }
                            />

                          </div>

                          <div>

                            <label className={labelClass}>
                              Awards &
                              Certifications
                            </label>

                            <textarea
                              name="awards_certifications"
                              value={
                                form.awards_certifications
                              }
                              onChange={
                                handleChange
                              }
                              rows={4}
                              className={
                                inputClass
                              }
                            />

                          </div>

                        </div>

                      </div>

                    </div>

                  </div>

                  {/* =================================================
                      FOOTER
                  ================================================= */}

                  <div className="flex flex-col-reverse gap-3 border-t border-[#e5d9ca] bg-[#faf5ed] px-5 py-5 sm:flex-row sm:justify-end sm:px-7">

                    <button
                      type="button"
                      onClick={closeModal}
                      disabled={saving}
                      className="rounded-xl border border-[#d5c6b5] px-6 py-3 text-xs font-semibold uppercase tracking-[0.12em]"
                    >
                      Cancel
                    </button>

                    <button
                      type="submit"
                      disabled={saving}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#351716] px-7 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-white disabled:opacity-60"
                    >

                      {saving ? (

                        <>
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                          Saving...
                        </>

                      ) : editingProduct ? (
                        "Update Product"
                      ) : (
                        "Create Product"
                      )}

                    </button>

                  </div>

                </form>

              </div>

            </div>

          </div>

        )}

        {/* =================================================
            VARIANTS MODAL
        ================================================= */}

        {variantsProduct && (

          <div className="fixed inset-0 z-[80] overflow-y-auto bg-[#241311]/70 p-4 backdrop-blur-sm sm:p-6">

            <div className="mx-auto flex min-h-full max-w-6xl items-center justify-center">

              <div className="w-full rounded-[2rem] border border-[#dfd1c1] bg-[#f5eee4] shadow-2xl">

                {/* VARIANT HEADER */}

                <div className="flex items-start justify-between border-b border-[#dfd1c1] bg-[#fffaf3] px-5 py-5 sm:px-7">

                  <div>

                    <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#a88342]">
                      VINEORA INVENTORY
                    </p>

                    <h2 className="mt-1 font-serif text-2xl text-[#351716]">
                      Manage Variants
                    </h2>

                    <p className="mt-1 text-sm text-[#6c5850]">
                      {variantsProduct.name}
                    </p>

                  </div>

                  <button
                    type="button"
                    onClick={closeVariants}
                    className="rounded-full border border-[#d9cbbb] bg-[#fffaf3] p-2 text-[#6c5850] transition hover:text-[#351716]"
                  >
                    <X size={18} />
                  </button>

                </div>

                {/* VARIANT COMPONENT */}

                <div className="max-h-[82vh] overflow-y-auto p-4 sm:p-6">

                  <ProductVariants
                    productId={
                      variantsProduct.id
                    }
                    productName={
                      variantsProduct.name
                    }
                  />

                </div>

              </div>

            </div>

          </div>

        )}

      </div>

    </div>
  );
};

export default Products;