const { body, validationResult } = require("express-validator");

const Book = require("../models/book");
const BookInstance = require("../models/bookinstance");
const asyncHandler = require("express-async-handler");
const bookinstance = require("../models/bookinstance");

exports.bookinstance_list = asyncHandler(async (req, res, next) => {
    const allBookInstances = await BookInstance.find()
        .populate("book")
        .exec();

    res.render("bookinstance_list", { 
        title: "Book Instance List", 
        bookinstance_list: allBookInstances,
    });
});

exports.bookinstance_detail = asyncHandler(async (req, res, next) => {
    const bookInstance = await BookInstance
        .findById(req.params.id)
        .populate("book")
        .exec()

    if (bookInstance === null) {
        const err = new Error("Book copy not found");
        err.status = 404;
        return next(err);
    }

    res.render("bookinstance_detail", {
        title: "Book:",
        bookinstance: bookInstance,
    });
});

exports.bookinstance_create_get = asyncHandler(async (req, res, next) => {
    const allBooks = await Book.find({}, "title").sort({ title: 1}).exec();

    res.render("bookinstance_form", {
        title: "Create BookInstance",
        book_list: allBooks,
    });
});

exports.bookinstance_create_post = [
    body("book", "Book must be specified").trim().isLength({ min: 1 }).escape(),
    body("imprint", "Imprint must be specified").trim().isLength({ min: 1 }).escape(),
    body("status").escape(),
    body("due_back", "Invalid date").optional({ values: "falsy" }).isISO8601().toDate(),

    asyncHandler(async (req, res, next) => {
        // Extract the validation errors from a request.
        const errors = validationResult(req);

        // Create a BookInstance object with escaped and trimmed data.
        const bookInstance = new BookInstance({
            book: req.body.book,
            imprint: req.body.imprint,
            status: req.body.status,
            due_back: req.body.due_back,
        });

        if (!errors.isEmpty()) {
            // There are errors.
            // Render form again with sanitized values and error messages.
            const allBooks = await Book.find({}, "title").sort({ title: 1 }).exec();

            res.render("bookinstance_form", {
                title: "Create BookInstance",
                book_list: allBooks,
                selected_book: bookInstance.book._id,
                errors: errors.array(),
                bookinstance: bookInstance,        
            });
            return;
        } else {
            // Data from form is valid
            await bookInstance.save();
            res.redirect(bookInstance.url);
    }
  }),

];

exports.bookinstance_update_get = asyncHandler(async (req, res, next) => {
    // Get the book status, imprint, due_back
    const [book_instance, allBooks] = await Promise.all([ 
        BookInstance.findById(req.params.id).exec(),
        Book.find({}, "title").sort({ title: 1 }).exec(),
    ]);

    if ( book_instance === null) {
        // No results.
        const err = new Error("Book copy not found");
        err.status = 404;
        return next(err);
    }

    res.render("bookinstance_form", {
        title: "Update Book Copy",
        bookinstance: book_instance,
        book_list: allBooks
    })

});

exports.bookinstance_update_post = [
  // Validate and sanitize fields.
  body("book", "Book must be specified").trim().isLength({ min: 1 }).escape(),
  body("imprint", "Imprint must be specified")
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body("status").escape(),
  body("due_back", "Invalid date")
    .optional({ values: "falsy" })
    .isISO8601()
    .toDate(),

  // Process request after validation and sanitization.
  asyncHandler(async (req, res, next) => {
    // Extract the validation errors from a request.
    const errors = validationResult(req);

    // Create a BookInstance object with escaped/trimmed data and current id.
    const bookInstance = new BookInstance({
      book: req.body.book,
      imprint: req.body.imprint,
      status: req.body.status,
      due_back: req.body.due_back,
      _id: req.params.id,
    });

    if (!errors.isEmpty()) {
      // There are errors.
      // Render the form again, passing sanitized values and errors.

      const allBooks = await Book.find({}, "title").exec();

      res.render("bookinstance_form", {
        title: "Update BookInstance",
        book_list: allBooks,
        selected_book: bookInstance.book._id,
        errors: errors.array(),
        bookinstance: bookInstance,
      });
      return;
    } else {
      // Data from form is valid.
      await BookInstance.findByIdAndUpdate(req.params.id, bookInstance, {});
      // Redirect to detail page.
      res.redirect(bookInstance.url);
    }
  }),
];


exports.bookinstance_delete_get = asyncHandler(async (req, res, next) => {
    const bookInstance = await BookInstance.findById(req.params.id).populate("book").exec();

    if (bookInstance === null) {
        res.redirect("/catalog/bookinstances");
    }

    res.render("bookinstance_delete", {
        title: "Delete Book Copy",
        bookinstance: bookInstance,
    });
});

exports.bookinstance_delete_post = asyncHandler(async (req, res, next) => {
    const bookInstance = await BookInstance.findById(req.params.id);

    if (bookInstance === null) {
        res.redirect("/catalog/bookinstances");
    } else {
        await BookInstance.findByIdAndDelete(req.params.id);
        res.redirect("/catalog/bookinstances");
    }
});
