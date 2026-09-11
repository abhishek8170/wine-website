import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import ProductCard from "../components/ProductCard";

const API_URL = "http://localhost:5000/api/products";

function Shop() {
  const [searchParams, setSearchParams] = useSearchParams();

  // =====================================================
  // URL VALUES
  // =====================================================

  const categoryFromUrl = searchParams.get("category") || "";
  const searchFromUrl = searchParams.get("search") || "";

  // =====================================================
  // PRODUCTS
  // =====================================================

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // =====================================================
  // SEARCH
  // =====================================================

  const [searchInput, setSearchInput] = useState(searchFromUrl);

  // =====================================================
  // FILTER STATE
  // =====================================================

  const [filters, setFilters] = useState({
    winery: searchParams.get("winery") || "",
    country: searchParams.get("country") || "",
    region: searchParams.get("region") || "",
    grape_variety: searchParams.get("grape_variety") || "",
    vintage: searchParams.get("vintage") || "",
    min_price: searchParams.get("min_price") || "",
    max_price: searchParams.get("max_price") || "",
    bottle_size: searchParams.get("bottle_size") || "",
    min_alcohol: searchParams.get("min_alcohol") || "",
    max_alcohol: searchParams.get("max_alcohol") || "",
    body: searchParams.get("body") || "",
    sweetness: searchParams.get("sweetness") || "",
    min_rating: searchParams.get("min_rating") || "",
    availability: searchParams.get("availability") || "",
    food_pairing: searchParams.get("food_pairing") || "",
    collection: searchParams.get("collection") || "",
  });

  const [sortBy, setSortBy] = useState(
    searchParams.get("sort") || "default"
  );

  const [filtersOpen, setFiltersOpen] = useState(false);

  // =====================================================
  // SYNC SEARCH INPUT WITH URL
  // =====================================================

  useEffect(() => {
    setSearchInput(searchFromUrl);
  }, [searchFromUrl]);

  // =====================================================
  // FETCH CATEGORIES
  // =====================================================

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch(
          "http://localhost:5000/api/categories"
        );

        if (!response.ok) {
          throw new Error("Failed to fetch categories");
        }

        const data = await response.json();

        if (data.success) {
          setCategories(data.categories || []);
        }
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };

    fetchCategories();
  }, []);

  // =====================================================
  // FETCH PRODUCTS
  // =====================================================

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError("");

        const params = new URLSearchParams();

        if (categoryFromUrl) {
          params.set("category", categoryFromUrl);
        }

        if (filters.winery) {
          params.set("winery", filters.winery);
        }

        if (filters.country) {
          params.set("country", filters.country);
        }

        if (filters.region) {
          params.set("region", filters.region);
        }

        if (filters.grape_variety) {
          params.set("grape_variety", filters.grape_variety);
        }

        if (filters.vintage) {
          params.set("vintage", filters.vintage);
        }

        if (filters.min_price) {
          params.set("min_price", filters.min_price);
        }

        if (filters.max_price) {
          params.set("max_price", filters.max_price);
        }

        if (filters.bottle_size) {
          params.set("bottle_size", filters.bottle_size);
        }

        if (filters.min_alcohol) {
          params.set("min_alcohol", filters.min_alcohol);
        }

        if (filters.max_alcohol) {
          params.set("max_alcohol", filters.max_alcohol);
        }

        if (filters.body) {
          params.set("body", filters.body);
        }

        if (filters.sweetness) {
          params.set("sweetness", filters.sweetness);
        }

        if (filters.min_rating) {
          params.set("min_rating", filters.min_rating);
        }

        if (filters.availability) {
          params.set("availability", filters.availability);
        }

        if (filters.food_pairing) {
          params.set("food_pairing", filters.food_pairing);
        }

        if (filters.collection) {
          params.set("collection", filters.collection);
        }

        if (sortBy !== "default") {
          params.set("sort", sortBy);
        }

        const queryString = params.toString();

        const url = queryString
          ? `${API_URL}?${queryString}`
          : API_URL;

        const response = await fetch(url);

        if (!response.ok) {
          throw new Error("Failed to fetch products");
        }

        const data = await response.json();

        setProducts(data.products || []);
      } catch (error) {
        console.error("Error fetching products:", error);

        setError(
          "Unable to load wines. Please try again."
        );

        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [
    categoryFromUrl,
    filters.winery,
    filters.country,
    filters.region,
    filters.grape_variety,
    filters.vintage,
    filters.min_price,
    filters.max_price,
    filters.bottle_size,
    filters.min_alcohol,
    filters.max_alcohol,
    filters.body,
    filters.sweetness,
    filters.min_rating,
    filters.availability,
    filters.food_pairing,
    filters.collection,
    sortBy,
  ]);

  // =====================================================
  // SEARCH
  // =====================================================

  const handleSearchSubmit = (event) => {
    event.preventDefault();

    const params = new URLSearchParams(searchParams);

    const value = searchInput.trim();

    if (value) {
      params.set("search", value);
    } else {
      params.delete("search");
    }

    setSearchParams(params);
  };

  // =====================================================
  // CLIENT-SIDE SEARCH
  // =====================================================

  const searchedProducts = useMemo(() => {
    if (!searchFromUrl.trim()) {
      return products;
    }

    const searchTerm = searchFromUrl.toLowerCase().trim();

    return products.filter((product) => {
      const searchableText = [
        product.name,
        product.winery_name,
        product.category_name,
        product.category_slug,
        product.region,
        product.country,
        product.grape_variety,
        product.description,
        product.tasting_notes,
        product.aroma,
        product.taste_profile,
        product.body,
        product.sweetness,
        product.food_pairing,
        product.vintage,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchableText.includes(searchTerm);
    });
  }, [products, searchFromUrl]);

  // =====================================================
  // FILTER OPTIONS
  // =====================================================

  const filterOptions = useMemo(() => {
    const unique = (values) =>
      [...new Set(values.filter(Boolean))].sort((a, b) =>
        String(a).localeCompare(String(b))
      );

    const wineryValues = unique(
      products.map((product) => product.winery_name)
    );

    const countryValues = unique(
      products.map((product) => product.country)
    );

    const regionValues = unique(
      products.map((product) => product.region)
    );

    const grapeValues = unique(
      products.map((product) => product.grape_variety)
    );

    const vintageValues = unique(
      products.map((product) => product.vintage)
    ).sort((a, b) => Number(b) - Number(a));

    const bottleValues = unique(
      products.flatMap((product) =>
        (product.variants || []).map(
          (variant) => variant.bottle_size
        )
      )
    );

    const bodyValues = unique(
      products.map((product) => product.body)
    );

    const sweetnessValues = unique(
      products.map((product) => product.sweetness)
    );

    return {
      wineries: wineryValues,
      countries: countryValues,
      regions: regionValues,
      grapes: grapeValues,
      vintages: vintageValues,
      bottles: bottleValues,
      bodies: bodyValues,
      sweetness: sweetnessValues,
    };
  }, [products]);

  // =====================================================
  // PRICE RANGE
  // =====================================================

  const priceRange = useMemo(() => {
    const prices = products
      .flatMap((product) =>
        (product.variants || []).map(
          (variant) => Number(variant.selling_price)
        )
      )
      .filter((price) => Number.isFinite(price));

    if (prices.length === 0) {
      return {
        min: 0,
        max: 0,
      };
    }

    return {
      min: Math.min(...prices),
      max: Math.max(...prices),
    };
  }, [products]);

  // =====================================================
  // FILTER UPDATE
  // =====================================================

  const updateFilter = (name, value) => {
    const updatedFilters = {
      ...filters,
      [name]: value,
    };

    setFilters(updatedFilters);

    const params = new URLSearchParams(searchParams);

    if (value) {
      params.set(name, value);
    } else {
      params.delete(name);
    }

    setSearchParams(params);
  };

  // =====================================================
  // CATEGORY
  // =====================================================

  const selectCategory = (slug) => {
    const params = new URLSearchParams(searchParams);

    if (slug) {
      params.set("category", slug);
    } else {
      params.delete("category");
    }

    setSearchParams(params);
  };

  // =====================================================
  // CLEAR SEARCH
  // =====================================================

  const clearSearch = () => {
    const params = new URLSearchParams(searchParams);

    params.delete("search");

    setSearchInput("");

    setSearchParams(params);
  };

  // =====================================================
  // CLEAR CATEGORY
  // =====================================================

  const clearCategory = () => {
    const params = new URLSearchParams(searchParams);

    params.delete("category");

    setSearchParams(params);
  };

  // =====================================================
  // CLEAR ALL FILTERS
  // =====================================================

  const clearAllFilters = () => {
    setFilters({
      winery: "",
      country: "",
      region: "",
      grape_variety: "",
      vintage: "",
      min_price: "",
      max_price: "",
      bottle_size: "",
      min_alcohol: "",
      max_alcohol: "",
      body: "",
      sweetness: "",
      min_rating: "",
      availability: "",
      food_pairing: "",
      collection: "",
    });

    setSearchInput("");

    setSortBy("default");

    setSearchParams({});
  };

  // =====================================================
  // SORT
  // =====================================================

  const handleSortChange = (value) => {
    setSortBy(value);

    const params = new URLSearchParams(searchParams);

    if (value === "default") {
      params.delete("sort");
    } else {
      params.set("sort", value);
    }

    setSearchParams(params);
  };

  // =====================================================
  // ACTIVE FILTER COUNT
  // =====================================================

  const activeFilterCount = Object.values(filters).filter(
    Boolean
  ).length;

  // =====================================================
  // CATEGORY NAME
  // =====================================================

  const selectedCategoryName =
    categories.find(
      (item) => item.slug === categoryFromUrl
    )?.name || categoryFromUrl;

  // =====================================================
  // FINAL PRODUCTS
  // =====================================================

  const displayedProducts = searchedProducts;

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <main className="min-h-screen bg-[#f3e8d7] pb-24 text-[#351716] md:pb-0">

      {/* =================================================
          HERO
      ================================================= */}

      <section className="border-b border-[#c9a45c]/30 bg-[#351716] px-6 py-16 text-center text-[#f3e8d7] md:py-20">
        <p className="mb-3 text-sm font-medium uppercase tracking-[0.35em] text-[#c9a45c]">
          VINEORA COLLECTION
        </p>

        <h1 className="font-serif text-4xl font-semibold md:text-6xl">
          Discover Our Wines
        </h1>

        <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-[#f3e8d7]/75 md:text-base">
          A curated collection of exceptional wines,
          crafted for memorable moments.
        </p>
      </section>

      {/* =================================================
          MAIN SHOP
      ================================================= */}

      <section className="mx-auto w-full max-w-[1280px] px-5 py-10 md:px-8 md:py-12">

        {/* =================================================
            SEARCH
        ================================================= */}

        <form
          onSubmit={handleSearchSubmit}
          className="mb-8"
        >
          <div className="relative">

            <span className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-lg text-[#351716]/50">
              ⌕
            </span>

            <input
              type="text"
              value={searchInput}
              onChange={(event) =>
                setSearchInput(event.target.value)
              }
              placeholder="Search wines, brands, regions…"
              className="w-full rounded-full border border-[#351716]/15 bg-white/45 py-4 pl-12 pr-32 text-sm text-[#351716] outline-none backdrop-blur-md transition placeholder:text-[#351716]/45 focus:border-[#c9a45c] focus:bg-white/60"
            />

            {searchInput && (
              <button
                type="button"
                onClick={clearSearch}
                className="absolute right-24 top-1/2 -translate-y-1/2 text-xs uppercase tracking-[0.15em] text-[#351716]/55 transition hover:text-[#351716]"
              >
                Clear
              </button>
            )}

            <button
              type="submit"
              className="absolute right-2 top-2 bottom-2 rounded-full bg-[#351716] px-5 text-xs font-semibold uppercase tracking-[0.12em] text-[#f3e8d7] transition hover:bg-[#4a211f]"
            >
              Search
            </button>

          </div>
        </form>

        {/* =================================================
            CATEGORY TABS
        ================================================= */}

        <div className="mb-8 overflow-x-auto">
          <div className="flex min-w-max items-center gap-2 border-b border-[#351716]/10 pb-5">

            <button
              type="button"
              onClick={() => selectCategory("")}
              className={`rounded-full px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.12em] transition ${
                !categoryFromUrl
                  ? "bg-[#351716] text-[#f3e8d7]"
                  : "text-[#351716]/65 hover:bg-white/50"
              }`}
            >
              All Wines
            </button>

            {categories.map((wineCategory) => (
              <button
                key={wineCategory.id}
                type="button"
                onClick={() =>
                  selectCategory(wineCategory.slug)
                }
                className={`rounded-full px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.12em] transition ${
                  categoryFromUrl === wineCategory.slug
                    ? "bg-[#351716] text-[#f3e8d7]"
                    : "text-[#351716]/65 hover:bg-white/50"
                }`}
              >
                {wineCategory.name}
              </button>
            ))}

          </div>
        </div>

        {/* =================================================
            MOBILE FILTER BUTTON
        ================================================= */}

        <div className="mb-6 flex gap-3 md:hidden">

          <button
            type="button"
            onClick={() => setFiltersOpen(true)}
            className="flex flex-1 items-center justify-center gap-2 rounded-full border border-[#351716]/15 bg-white/50 px-5 py-3 text-xs font-semibold uppercase tracking-[0.15em] backdrop-blur-md"
          >
            Filters

            {activeFilterCount > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#351716] px-1.5 text-[10px] text-[#f3e8d7]">
                {activeFilterCount}
              </span>
            )}
          </button>

          <select
            value={sortBy}
            onChange={(event) =>
              handleSortChange(event.target.value)
            }
            className="rounded-full border border-[#351716]/15 bg-white/50 px-4 py-3 text-xs outline-none"
          >
            <option value="default">Featured</option>
            <option value="popular">Popular</option>
            <option value="price-low">
              Price: Low to High
            </option>
            <option value="price-high">
              Price: High to Low
            </option>
            <option value="newest">Newest</option>
            <option value="highest-rated">
              Highest Rated
            </option>
          </select>

        </div>

        {/* =================================================
            CONTENT GRID
        ================================================= */}

        <div className="grid gap-8 md:grid-cols-[260px_1fr]">

          {/* =================================================
              DESKTOP FILTER SIDEBAR
          ================================================= */}

          <aside className="hidden md:block">

            <div className="sticky top-6 rounded-[28px] border border-[#351716]/10 bg-white/35 p-6 backdrop-blur-md">

              <div className="mb-6 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#c9a45c]">
                    Refine
                  </p>

                  <h2 className="mt-1 font-serif text-2xl">
                    Filters
                  </h2>
                </div>

                {activeFilterCount > 0 && (
                  <button
                    type="button"
                    onClick={clearAllFilters}
                    className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#351716]/55 hover:text-[#351716]"
                  >
                    Clear all
                  </button>
                )}
              </div>

              <FilterContent
                filters={filters}
                updateFilter={updateFilter}
                options={filterOptions}
                priceRange={priceRange}
              />

            </div>
          </aside>

          {/* =================================================
              PRODUCT AREA
          ================================================= */}

          <div className="min-w-0">

            {/* TOP BAR */}

            <div className="mb-8 flex flex-col gap-5 border-b border-[#351716]/15 pb-6 md:flex-row md:items-center md:justify-between">

              <div>

                <p className="text-sm text-[#351716]/70">
                  {loading
                    ? "Discovering wines..."
                    : `${displayedProducts.length} ${
                        displayedProducts.length === 1
                          ? "wine"
                          : "wines"
                      }`}
                </p>

                <div className="mt-2 flex flex-wrap items-center gap-2">

                  {categoryFromUrl && (
                    <span className="rounded-full bg-[#351716]/8 px-3 py-1 text-xs">
                      Category: {selectedCategoryName}

                      <button
                        type="button"
                        onClick={clearCategory}
                        className="ml-2 font-semibold"
                      >
                        ×
                      </button>
                    </span>
                  )}

                  {searchFromUrl && (
                    <span className="rounded-full bg-[#c9a45c]/20 px-3 py-1 text-xs">
                      Search: "{searchFromUrl}"

                      <button
                        type="button"
                        onClick={clearSearch}
                        className="ml-2 font-semibold"
                      >
                        ×
                      </button>
                    </span>
                  )}

                  {activeFilterCount > 0 && (
                    <span className="rounded-full bg-[#351716]/8 px-3 py-1 text-xs">
                      {activeFilterCount} filter
                      {activeFilterCount !== 1
                        ? "s"
                        : ""} applied
                    </span>
                  )}

                </div>

              </div>

              {/* DESKTOP SORT */}

              <div className="hidden items-center gap-3 md:flex">

                <label
                  htmlFor="sort"
                  className="text-xs font-semibold uppercase tracking-[0.15em] text-[#351716]/55"
                >
                  Sort by
                </label>

                <select
                  id="sort"
                  value={sortBy}
                  onChange={(event) =>
                    handleSortChange(
                      event.target.value
                    )
                  }
                  className="rounded-full border border-[#351716]/15 bg-white/50 px-5 py-3 text-sm outline-none backdrop-blur-md"
                >
                  <option value="default">
                    Featured
                  </option>

                  <option value="popular">
                    Popular
                  </option>

                  <option value="price-low">
                    Price: Low to High
                  </option>

                  <option value="price-high">
                    Price: High to Low
                  </option>

                  <option value="newest">
                    Newest
                  </option>

                  <option value="highest-rated">
                    Highest Rated
                  </option>
                </select>

              </div>

            </div>

            {/* LOADING */}

            {loading && (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {[1, 2, 3, 4, 5, 6].map((item) => (
                  <div
                    key={item}
                    className="h-[430px] animate-pulse rounded-[28px] bg-[#351716]/8"
                  />
                ))}
              </div>
            )}

            {/* ERROR */}

            {!loading && error && (
              <div className="rounded-[28px] border border-red-900/10 bg-red-900/5 p-10 text-center">
                <p className="text-sm text-red-900/70">
                  {error}
                </p>

                <button
                  type="button"
                  onClick={() =>
                    window.location.reload()
                  }
                  className="mt-5 rounded-full bg-[#351716] px-6 py-3 text-xs font-semibold uppercase tracking-[0.15em] text-[#f3e8d7]"
                >
                  Try Again
                </button>
              </div>
            )}

            {/* EMPTY */}

            {!loading &&
              !error &&
              displayedProducts.length === 0 && (
                <div className="rounded-[28px] border border-[#351716]/10 bg-white/30 px-6 py-20 text-center backdrop-blur-md">

                  <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#c9a45c]">
                    No Wines Found
                  </p>

                  <h2 className="mt-3 font-serif text-3xl">
                    Nothing matches your selection
                  </h2>

                  <p className="mx-auto mt-4 max-w-md text-sm leading-7 text-[#351716]/60">
                    Try removing a filter or searching
                    for another wine, region, grape variety,
                    or food pairing.
                  </p>

                  <button
                    type="button"
                    onClick={clearAllFilters}
                    className="mt-7 rounded-full bg-[#351716] px-7 py-3 text-xs font-semibold uppercase tracking-[0.15em] text-[#f3e8d7]"
                  >
                    Clear Filters
                  </button>

                </div>
              )}

            {/* PRODUCTS */}

            {!loading &&
              !error &&
              displayedProducts.length > 0 && (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
                  {displayedProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                    />
                  ))}
                </div>
              )}

          </div>
        </div>
      </section>

      {/* =================================================
          MOBILE FILTER DRAWER
      ================================================= */}

      {filtersOpen && (
        <div className="fixed inset-0 z-[100] md:hidden">

          {/* BACKDROP */}

          <button
            type="button"
            aria-label="Close filters"
            onClick={() => setFiltersOpen(false)}
            className="absolute inset-0 bg-[#351716]/55 backdrop-blur-sm"
          />

          {/* DRAWER */}

          <div className="absolute bottom-0 left-0 right-0 max-h-[88vh] overflow-y-auto rounded-t-[32px] bg-[#f3e8d7] px-6 pb-8 pt-5 shadow-2xl">

            <div className="mb-6 flex items-center justify-between">

              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#c9a45c]">
                  Refine
                </p>

                <h2 className="mt-1 font-serif text-3xl">
                  Filters
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setFiltersOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-[#351716]/15 text-lg"
              >
                ×
              </button>

            </div>

            <FilterContent
              filters={filters}
              updateFilter={updateFilter}
              options={filterOptions}
              priceRange={priceRange}
            />

            <div className="mt-8 flex gap-3">

              <button
                type="button"
                onClick={clearAllFilters}
                className="flex-1 rounded-full border border-[#351716]/20 px-5 py-4 text-xs font-semibold uppercase tracking-[0.15em]"
              >
                Clear All
              </button>

              <button
                type="button"
                onClick={() => setFiltersOpen(false)}
                className="flex-1 rounded-full bg-[#351716] px-5 py-4 text-xs font-semibold uppercase tracking-[0.15em] text-[#f3e8d7]"
              >
                Show Wines
              </button>

            </div>

          </div>
        </div>
      )}

    </main>
  );
}


// =====================================================
// FILTER CONTENT
// =====================================================

function FilterContent({
  filters,
  updateFilter,
  options,
  priceRange,
}) {
  return (
    <div className="space-y-7">

      {/* =================================================
          WINERY
      ================================================= */}

      <FilterSelect
        label="Brand / Winery"
        value={filters.winery}
        onChange={(value) =>
          updateFilter("winery", value)
        }
        options={options.wineries}
        placeholder="All wineries"
      />

      {/* =================================================
          COUNTRY
      ================================================= */}

      <FilterSelect
        label="Country"
        value={filters.country}
        onChange={(value) =>
          updateFilter("country", value)
        }
        options={options.countries}
        placeholder="All countries"
      />

      {/* =================================================
          REGION
      ================================================= */}

      <FilterSelect
        label="Region"
        value={filters.region}
        onChange={(value) =>
          updateFilter("region", value)
        }
        options={options.regions}
        placeholder="All regions"
      />

      {/* =================================================
          GRAPE
      ================================================= */}

      <FilterSelect
        label="Grape Variety"
        value={filters.grape_variety}
        onChange={(value) =>
          updateFilter("grape_variety", value)
        }
        options={options.grapes}
        placeholder="All grape varieties"
      />

      {/* =================================================
          VINTAGE
      ================================================= */}

      <FilterSelect
        label="Vintage"
        value={filters.vintage}
        onChange={(value) =>
          updateFilter("vintage", value)
        }
        options={options.vintages}
        placeholder="All vintages"
      />

      {/* =================================================
          BOTTLE SIZE
      ================================================= */}

      <FilterSelect
        label="Bottle Size"
        value={filters.bottle_size}
        onChange={(value) =>
          updateFilter("bottle_size", value)
        }
        options={options.bottles}
        placeholder="All sizes"
      />

      {/* =================================================
          BODY
      ================================================= */}

      <FilterSelect
        label="Body"
        value={filters.body}
        onChange={(value) =>
          updateFilter("body", value)
        }
        options={options.bodies}
        placeholder="Any body"
      />

      {/* =================================================
          SWEETNESS
      ================================================= */}

      <FilterSelect
        label="Sweetness"
        value={filters.sweetness}
        onChange={(value) =>
          updateFilter("sweetness", value)
        }
        options={options.sweetness}
        placeholder="Any sweetness"
      />

      {/* =================================================
          PRICE
      ================================================= */}

      <div>

        <FilterLabel>
          Price
        </FilterLabel>

        <div className="grid grid-cols-2 gap-2">

          <input
            type="number"
            min="0"
            placeholder={
              priceRange.min
                ? `₹${priceRange.min}`
                : "Min"
            }
            value={filters.min_price}
            onChange={(event) =>
              updateFilter(
                "min_price",
                event.target.value
              )
            }
            className="w-full rounded-xl border border-[#351716]/15 bg-white/50 px-3 py-3 text-sm outline-none focus:border-[#c9a45c]"
          />

          <input
            type="number"
            min="0"
            placeholder={
              priceRange.max
                ? `₹${priceRange.max}`
                : "Max"
            }
            value={filters.max_price}
            onChange={(event) =>
              updateFilter(
                "max_price",
                event.target.value
              )
            }
            className="w-full rounded-xl border border-[#351716]/15 bg-white/50 px-3 py-3 text-sm outline-none focus:border-[#c9a45c]"
          />

        </div>
      </div>

      {/* =================================================
          ALCOHOL
      ================================================= */}

      <div>

        <FilterLabel>
          Alcohol %
        </FilterLabel>

        <div className="grid grid-cols-2 gap-2">

          <input
            type="number"
            step="0.1"
            min="0"
            placeholder="Min %"
            value={filters.min_alcohol}
            onChange={(event) =>
              updateFilter(
                "min_alcohol",
                event.target.value
              )
            }
            className="w-full rounded-xl border border-[#351716]/15 bg-white/50 px-3 py-3 text-sm outline-none focus:border-[#c9a45c]"
          />

          <input
            type="number"
            step="0.1"
            min="0"
            placeholder="Max %"
            value={filters.max_alcohol}
            onChange={(event) =>
              updateFilter(
                "max_alcohol",
                event.target.value
              )
            }
            className="w-full rounded-xl border border-[#351716]/15 bg-white/50 px-3 py-3 text-sm outline-none focus:border-[#c9a45c]"
          />

        </div>
      </div>

      {/* =================================================
          RATING
      ================================================= */}

      <FilterSelect
        label="Rating"
        value={filters.min_rating}
        onChange={(value) =>
          updateFilter("min_rating", value)
        }
        options={["5", "4", "3", "2", "1"]}
        optionLabels={{
          5: "★★★★★ 5+",
          4: "★★★★ 4+",
          3: "★★★ 3+",
          2: "★★ 2+",
          1: "★ 1+",
        }}
        placeholder="Any rating"
      />

      {/* =================================================
          AVAILABILITY
      ================================================= */}

      <FilterSelect
        label="Availability"
        value={filters.availability}
        onChange={(value) =>
          updateFilter("availability", value)
        }
        options={["in-stock", "out-of-stock"]}
        optionLabels={{
          "in-stock": "In Stock",
          "out-of-stock": "Out of Stock",
        }}
        placeholder="Any availability"
      />

      {/* =================================================
          FOOD PAIRING
      ================================================= */}

      <div>

        <FilterLabel>
          Food Pairing
        </FilterLabel>

        <input
          type="text"
          value={filters.food_pairing}
          onChange={(event) =>
            updateFilter(
              "food_pairing",
              event.target.value
            )
          }
          placeholder="e.g. seafood, steak, pasta"
          className="w-full rounded-xl border border-[#351716]/15 bg-white/50 px-3 py-3 text-sm outline-none placeholder:text-[#351716]/35 focus:border-[#c9a45c]"
        />

      </div>

      {/* =================================================
          COLLECTION
      ================================================= */}

      <div>

        <FilterLabel>
          Organic / Special Collections
        </FilterLabel>

        <select
          value={filters.collection}
          onChange={(event) =>
            updateFilter(
              "collection",
              event.target.value
            )
          }
          className="w-full rounded-xl border border-[#351716]/15 bg-white/50 px-3 py-3 text-sm outline-none focus:border-[#c9a45c]"
        >
          <option value="">
            All collections
          </option>

          <option value="best-sellers">
            Best Sellers
          </option>

          <option value="organic">
            Organic
          </option>
        </select>

      </div>

    </div>
  );
}


// =====================================================
// SELECT
// =====================================================

function FilterSelect({
  label,
  value,
  onChange,
  options,
  placeholder,
  optionLabels = {},
}) {
  return (
    <div>

      <FilterLabel>
        {label}
      </FilterLabel>

      <select
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        className="w-full rounded-xl border border-[#351716]/15 bg-white/50 px-3 py-3 text-sm outline-none transition focus:border-[#c9a45c]"
      >
        <option value="">
          {placeholder}
        </option>

        {options.map((option) => (
          <option key={option} value={option}>
            {optionLabels[option] || option}
          </option>
        ))}
      </select>

    </div>
  );
}


// =====================================================
// FILTER LABEL
// =====================================================

function FilterLabel({ children }) {
  return (
    <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.18em] text-[#351716]/60">
      {children}
    </label>
  );
}


export default Shop;