const fs = require("fs");
const path = require("path");
const pool = require("../config/db");

/*
|--------------------------------------------------------------------------
| HELPER — DELETE IMAGE FILE
|--------------------------------------------------------------------------
*/

const deleteImageFile = (imageUrl) => {
  try {
    if (!imageUrl) {
      return;
    }

    /*
    | Only delete local uploaded files.
    | Do not try to delete external URLs.
    */

    if (
      imageUrl.startsWith("http://") ||
      imageUrl.startsWith("https://")
    ) {
      return;
    }

    /*
    | Example:
    | /uploads/our-story-vineyard-123.jpg
    |
    | Converts to:
    | backend/uploads/our-story-vineyard-123.jpg
    */

    const relativePath = imageUrl.replace(
      /^\/+/,
      ""
    );

    const filePath = path.join(
      __dirname,
      "..",
      relativePath
    );

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);

      console.log(
        "Deleted old Our Story image:",
        filePath
      );
    }
  } catch (error) {
    /*
    | Do not fail the database operation if
    | old image deletion fails.
    */

    console.error(
      "Our Story old image delete error:",
      error
    );
  }
};

/*
|--------------------------------------------------------------------------
| GET ADMIN OUR STORY
|--------------------------------------------------------------------------
|
| GET:
| /api/admin/our-story
|
| Returns:
| - Vineyard record
| - Team records
|
|--------------------------------------------------------------------------
*/

const getAdminOurStory = async (
  req,
  res
) => {
  try {
    const vineyardResult =
      await pool.query(`
        SELECT
          id,
          title,
          description,
          location,
          grape_varieties,
          image_url,
          image_alt,
          display_order,
          is_active,
          created_at,
          updated_at
        FROM our_story_vineyard
        ORDER BY
          display_order ASC,
          id ASC
      `);

    const teamResult =
      await pool.query(`
        SELECT
          id,
          name,
          role,
          bio,
          image_url,
          image_alt,
          display_order,
          is_active,
          created_at,
          updated_at
        FROM our_story_team
        ORDER BY
          display_order ASC,
          id ASC
      `);

    return res.status(200).json({
      success: true,

      vineyard:
        vineyardResult.rows,

      team:
        teamResult.rows,
    });
  } catch (error) {
    console.error(
      "Admin Our Story GET error:",
      error
    );

    return res.status(500).json({
      success: false,

      message:
        "Failed to load Our Story photography.",
    });
  }
};

/*
|--------------------------------------------------------------------------
| UPLOAD OUR STORY IMAGE
|--------------------------------------------------------------------------
|
| Vineyard:
|
| POST
| /api/admin/our-story/image/vineyard
|
| Team:
|
| POST
| /api/admin/our-story/image/team/1
|
| POST
| /api/admin/our-story/image/team/2
|
| POST
| /api/admin/our-story/image/team/3
|
|--------------------------------------------------------------------------
*/

const uploadOurStoryImageFile = async (
  req,
  res
) => {
  try {
    /*
    |--------------------------------------------------------------------------
    | GET PARAMETERS
    |--------------------------------------------------------------------------
    */

    const type = String(
      req.params.type || ""
    )
      .trim()
      .toLowerCase();

    const slot = Number(
      req.params.slot || 0
    );

    console.log(
      "OUR STORY UPLOAD:",
      {
        type,
        slot,
        file:
          req.file
            ? req.file.filename
            : null,
      }
    );

    /*
    |--------------------------------------------------------------------------
    | VALIDATE TYPE
    |--------------------------------------------------------------------------
    */

    if (
      type !== "vineyard" &&
      type !== "team"
    ) {
      return res.status(400).json({
        success: false,

        message:
          "Invalid Our Story image type.",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | VALIDATE FILE
    |--------------------------------------------------------------------------
    */

    if (!req.file) {
      return res.status(400).json({
        success: false,

        message:
          "Please select an image.",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | IMAGE URL
    |--------------------------------------------------------------------------
    */

    const imageUrl =
      `/uploads/${req.file.filename}`;

    /*
    |--------------------------------------------------------------------------
    | VINEYARD IMAGE
    |--------------------------------------------------------------------------
    */

    if (type === "vineyard") {
      /*
      |--------------------------------------------------------------------------
      | FIND VINEYARD RECORD
      |--------------------------------------------------------------------------
      */

      const existing =
        await pool.query(`
          SELECT
            id,
            image_url
          FROM our_story_vineyard
          WHERE display_order = 1
          ORDER BY id ASC
          LIMIT 1
        `);

      /*
      |--------------------------------------------------------------------------
      | EXISTING VINEYARD RECORD
      |--------------------------------------------------------------------------
      */

      if (
        existing.rows.length > 0
      ) {
        const existingRecord =
          existing.rows[0];

        /*
        | Delete previous local image
        */

        if (
          existingRecord.image_url &&
          existingRecord.image_url !==
            imageUrl
        ) {
          deleteImageFile(
            existingRecord.image_url
          );
        }

        /*
        | Update only image-related data.
        | Existing content remains untouched.
        */

        await pool.query(
          `
            UPDATE
              our_story_vineyard
            SET
              image_url = $1,

              image_alt = COALESCE(
                NULLIF(image_alt, ''),
                'VINEORA vineyard'
              ),

              is_active = TRUE,

              updated_at =
                CURRENT_TIMESTAMP

            WHERE id = $2
          `,
          [
            imageUrl,
            existingRecord.id,
          ]
        );

        console.log(
          "Vineyard image updated:",
          imageUrl
        );
      }

      /*
      |--------------------------------------------------------------------------
      | NO VINEYARD RECORD
      |--------------------------------------------------------------------------
      */

      else {
        /*
        | The table may currently be empty.
        |
        | Create the minimum valid record
        | required by the database.
        */

        await pool.query(
          `
            INSERT INTO
              our_story_vineyard
            (
              title,
              description,
              location,
              grape_varieties,
              image_url,
              image_alt,
              display_order,
              is_active
            )
            VALUES
            (
              $1,
              $2,
              $3,
              $4,
              $5,
              $6,
              $7,
              TRUE
            )
          `,
          [
            "The VINEORA Vineyard",

            "The vineyard behind the wines.",

            "",

            "",

            imageUrl,

            "VINEORA vineyard",

            1,
          ]
        );

        console.log(
          "Vineyard record created:",
          imageUrl
        );
      }

      /*
      |--------------------------------------------------------------------------
      | SUCCESS
      |--------------------------------------------------------------------------
      */

      return res.status(200).json({
        success: true,

        message:
          "Vineyard image uploaded successfully.",

        image_url:
          imageUrl,
      });
    }

    /*
    |--------------------------------------------------------------------------
    | TEAM IMAGE
    |--------------------------------------------------------------------------
    */

    if (type === "team") {
      /*
      |--------------------------------------------------------------------------
      | VALIDATE TEAM SLOT
      |--------------------------------------------------------------------------
      */

      if (
        !Number.isInteger(slot) ||
        slot < 1 ||
        slot > 3
      ) {
        /*
        | The uploaded file is already saved by
        | multer, so remove it if the slot is invalid.
        */

        deleteImageFile(
          imageUrl
        );

        return res.status(400).json({
          success: false,

          message:
            "Team image slot must be 1, 2 or 3.",
        });
      }

      /*
      |--------------------------------------------------------------------------
      | FIND TEAM RECORD
      |--------------------------------------------------------------------------
      */

      const existing =
        await pool.query(
          `
            SELECT
              id,
              image_url
            FROM our_story_team
            WHERE display_order = $1
            ORDER BY id ASC
            LIMIT 1
          `,
          [slot]
        );

      /*
      |--------------------------------------------------------------------------
      | EXISTING TEAM RECORD
      |--------------------------------------------------------------------------
      */

      if (
        existing.rows.length > 0
      ) {
        const existingRecord =
          existing.rows[0];

        /*
        | Delete previous local image
        */

        if (
          existingRecord.image_url &&
          existingRecord.image_url !==
            imageUrl
        ) {
          deleteImageFile(
            existingRecord.image_url
          );
        }

        /*
        | Update only image fields.
        */

        await pool.query(
          `
            UPDATE
              our_story_team
            SET
              image_url = $1,

              image_alt = COALESCE(
                NULLIF(image_alt, ''),
                $2
              ),

              is_active = TRUE,

              updated_at =
                CURRENT_TIMESTAMP

            WHERE id = $3
          `,
          [
            imageUrl,

            `VINEORA team image ${String(
              slot
            ).padStart(2, "0")}`,

            existingRecord.id,
          ]
        );

        console.log(
          `Team image ${slot} updated:`,
          imageUrl
        );
      }

      /*
      |--------------------------------------------------------------------------
      | NO TEAM RECORD
      |--------------------------------------------------------------------------
      */

      else {
        /*
        | Default values are only used because
        | the database currently has no records.
        |
        | They allow the image slots to work
        | immediately without changing the
        | customer-facing Our Story content.
        */

        const defaults = {
          1: {
            name:
              "VINEORA Team",

            role:
              "Winemaking",
          },

          2: {
            name:
              "VINEORA Team",

            role:
              "Vineyard",
          },

          3: {
            name:
              "VINEORA Team",

            role:
              "Cellar",
          },
        };

        const teamDefault =
          defaults[slot];

        await pool.query(
          `
            INSERT INTO
              our_story_team
            (
              name,
              role,
              bio,
              image_url,
              image_alt,
              display_order,
              is_active
            )
            VALUES
            (
              $1,
              $2,
              $3,
              $4,
              $5,
              $6,
              TRUE
            )
          `,
          [
            teamDefault.name,

            teamDefault.role,

            "",

            imageUrl,

            `VINEORA team image ${String(
              slot
            ).padStart(2, "0")}`,

            slot,
          ]
        );

        console.log(
          `Team record ${slot} created:`,
          imageUrl
        );
      }

      /*
      |--------------------------------------------------------------------------
      | SUCCESS
      |--------------------------------------------------------------------------
      */

      return res.status(200).json({
        success: true,

        message:
          `Team image ${String(
            slot
          ).padStart(
            2,
            "0"
          )} uploaded successfully.`,

        image_url:
          imageUrl,
      });
    }

    /*
    |--------------------------------------------------------------------------
    | FALLBACK
    |--------------------------------------------------------------------------
    */

    deleteImageFile(
      imageUrl
    );

    return res.status(400).json({
      success: false,

      message:
        "Invalid Our Story image type.",
    });
  } catch (error) {
    console.error(
      "Admin Our Story image upload error:",
      error
    );

    /*
    | If database operation fails after
    | multer saved the image, remove the
    | newly uploaded file.
    */

    if (req.file) {
      deleteImageFile(
        `/uploads/${req.file.filename}`
      );
    }

    return res.status(500).json({
      success: false,

      message:
        "Failed to upload Our Story image.",

      error:
        process.env.NODE_ENV ===
        "development"
          ? error.message
          : undefined,
    });
  }
};

/*
|--------------------------------------------------------------------------
| REMOVE OUR STORY IMAGE
|--------------------------------------------------------------------------
|
| Vineyard:
|
| DELETE
| /api/admin/our-story/image/vineyard
|
| Team:
|
| DELETE
| /api/admin/our-story/image/team/1
|
| DELETE
| /api/admin/our-story/image/team/2
|
| DELETE
| /api/admin/our-story/image/team/3
|
|--------------------------------------------------------------------------
*/

const removeOurStoryImage = async (
  req,
  res
) => {
  try {
    /*
    |--------------------------------------------------------------------------
    | GET PARAMETERS
    |--------------------------------------------------------------------------
    */

    const type = String(
      req.params.type || ""
    )
      .trim()
      .toLowerCase();

    const slot = Number(
      req.params.slot || 0
    );

    console.log(
      "OUR STORY IMAGE REMOVE:",
      {
        type,
        slot,
      }
    );

    /*
    |--------------------------------------------------------------------------
    | VALIDATE TYPE
    |--------------------------------------------------------------------------
    */

    if (
      type !== "vineyard" &&
      type !== "team"
    ) {
      return res.status(400).json({
        success: false,

        message:
          "Invalid Our Story image type.",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | REMOVE VINEYARD IMAGE
    |--------------------------------------------------------------------------
    */

    if (type === "vineyard") {
      /*
      | Get current image first so
      | the physical file can also be removed.
      */

      const existing =
        await pool.query(`
          SELECT
            id,
            image_url
          FROM our_story_vineyard
          WHERE display_order = 1
          ORDER BY id ASC
          LIMIT 1
        `);

      /*
      | Nothing to remove.
      */

      if (
        existing.rows.length === 0
      ) {
        return res.status(200).json({
          success: true,

          message:
            "No vineyard image to remove.",
        });
      }

      const existingRecord =
        existing.rows[0];

      /*
      | Remove physical file.
      */

      deleteImageFile(
        existingRecord.image_url
      );

      /*
      | Remove DB reference.
      */

      await pool.query(
        `
          UPDATE
            our_story_vineyard
          SET
            image_url = NULL,

            updated_at =
              CURRENT_TIMESTAMP

          WHERE id = $1
        `,
        [existingRecord.id]
      );

      return res.status(200).json({
        success: true,

        message:
          "Vineyard image removed successfully.",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | REMOVE TEAM IMAGE
    |--------------------------------------------------------------------------
    */

    if (type === "team") {
      /*
      |--------------------------------------------------------------------------
      | VALIDATE SLOT
      |--------------------------------------------------------------------------
      */

      if (
        !Number.isInteger(slot) ||
        slot < 1 ||
        slot > 3
      ) {
        return res.status(400).json({
          success: false,

          message:
            "Team image slot must be 1, 2 or 3.",
        });
      }

      /*
      |--------------------------------------------------------------------------
      | FIND TEAM RECORD
      |--------------------------------------------------------------------------
      */

      const existing =
        await pool.query(
          `
            SELECT
              id,
              image_url
            FROM our_story_team
            WHERE display_order = $1
            ORDER BY id ASC
            LIMIT 1
          `,
          [slot]
        );

      /*
      | Nothing to remove.
      */

      if (
        existing.rows.length === 0
      ) {
        return res.status(200).json({
          success: true,

          message:
            `No team image ${String(
              slot
            ).padStart(
              2,
              "0"
            )} to remove.`,
        });
      }

      const existingRecord =
        existing.rows[0];

      /*
      | Remove physical file.
      */

      deleteImageFile(
        existingRecord.image_url
      );

      /*
      | Remove DB reference.
      */

      await pool.query(
        `
          UPDATE
            our_story_team
          SET
            image_url = NULL,

            updated_at =
              CURRENT_TIMESTAMP

          WHERE id = $1
        `,
        [existingRecord.id]
      );

      return res.status(200).json({
        success: true,

        message:
          `Team image ${String(
            slot
          ).padStart(
            2,
            "0"
          )} removed successfully.`,
      });
    }

    /*
    |--------------------------------------------------------------------------
    | FALLBACK
    |--------------------------------------------------------------------------
    */

    return res.status(400).json({
      success: false,

      message:
        "Invalid Our Story image type.",
    });
  } catch (error) {
    console.error(
      "Admin Our Story image remove error:",
      error
    );

    return res.status(500).json({
      success: false,

      message:
        "Failed to remove Our Story image.",

      error:
        process.env.NODE_ENV ===
        "development"
          ? error.message
          : undefined,
    });
  }
};

/*
|--------------------------------------------------------------------------
| EXPORT CONTROLLERS
|--------------------------------------------------------------------------
*/

module.exports = {
  getAdminOurStory,
  uploadOurStoryImageFile,
  removeOurStoryImage,
};