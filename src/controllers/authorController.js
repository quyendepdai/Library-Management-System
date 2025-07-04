import { StatusCodes } from "http-status-codes";
import Author from "../models/author.js";
import Book from "../models/books.js";

const getAllAuthors = async (req, res) => {
  try {
    const {
      search = "",
      page = 1,
      limit = 5,
      sortBy = "name",
      order = "desc",
    } = req.query;
    const skip = (page - 1) * limit;

    const sortOrder = order === "desc" ? -1 : 1;
    const sortOptions = {};
    if (sortBy === "name" || sortBy === "dateOfBirth") {
      sortOptions[sortBy] = sortOrder;
    }

    const query = search
      ? {
          name: { $regex: search, $options: "i" },
        }
      : {};

    const [totalDocuments, authors] = await Promise.all([
      Author.countDocuments(query),
      Author.find(query).sort(sortOptions).limit(limit).skip(skip),
    ]);

    const totalPages = Math.ceil(totalDocuments / limit);

    // console.log(page, totalPages);

    if (page < 1 || page > totalPages)
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: "Khong tim thay tac gia ban muon",
      });

    res
      .status(StatusCodes.OK)
      .json({ authors, totalPages, currentPage: page, totalDocuments });
  } catch (error) {
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: "Không có tác giả!", error: error.message });
  }
};

const getAll = async (req, res) => {
  try {
    const authors = await Author.find();

    if (authors.length === 0)
      return res.status(StatusCodes.NOT_FOUND).json({
        message: "khong co ban ghi nao",
      });

    res.status(StatusCodes.OK).json(authors);
  } catch (error) {
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: "Không có tác giả!", error: error.message });
  }
};

const getAuthorById = async (req, res) => {
  try {
    const author = await Author.findById(req.params.id);

    if (!author)
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ message: "Không tìm tác giả" });

    res.status(StatusCodes.OK).json(author);
  } catch (error) {
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: error.message });
  }
};

const createAuthor = async (req, res) => {
  try {
    const newAuthor = await new Author(req.body).save();

    if (!newAuthor)
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: "Có lỗi sảy ra, vui lòng thử lại sau ít phút." });

    res.status(StatusCodes.CREATED).json(newAuthor);
  } catch (error) {
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: error.message });
  }
};

const updateAuthor = async (req, res) => {
  try {
    const updatedAuthor = await Author.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!updatedAuthor)
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ message: "Tác giả không tồn tại" });

    res.status(StatusCodes.OK).json(updatedAuthor);
  } catch (error) {
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: error.message });
  }
};

const deleteAuthor = async (req, res) => {
  try {
    const { id } = req.params;
    const author = await Author.findById(id);
    if (!author) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ message: "Không tìm thấy tác giả." });
    }

    let defaultAuthor = await Author.findOne({ name: "Không rõ" });

    if (!defaultAuthor) {
      defaultAuthor = await Author.create({
        name: "Không rõ",
        bio: "Chưa có thông tin về tác giả của cuốn sách này đâu ạ",
      });
    }

    await Book.updateMany(
      { author: id },
      { $set: { author: defaultAuthor._id } }
    );

    await Author.findByIdAndDelete(id);

    return res.status(StatusCodes.OK).json({
      message: "Đã xoá tác giả",
    });
  } catch (error) {
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: error.message });
  }
};

export const authorController = {
  getAllAuthors,
  getAll,
  getAuthorById,
  createAuthor,
  updateAuthor,
  deleteAuthor,
};
