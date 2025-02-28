import sharp from "sharp";   // Install for convert 
import cloudinary from "../utils/cloudinary.js";
import  Post  from "../models/postModel.js";
import  User  from "../models/userModel.js"; // Import the User model
import  Comment from "../models/commentModel.js";

export const addNewPost = async (req, res) => {
  try {
    const { caption } = req.body;
    const image = req.file;
    const authorId = req.id;

    // ckecking image provide or not
    if (!image) return res.status(400).json({ message: "Image required" });
     
    // Optimize the image using sharp
    const optimizedImageBuffer = await sharp(image.buffer)
      .resize({ width: 800, height: 800, fit: "inside" })
      .toFormat("jpeg", { quality: 80 })
      .toBuffer();

    // Convert the image buffer to a data URL
    const fileUrl = `data:image/jpeg;base64,${optimizedImageBuffer.toString(
      "base64"
    )}`;
    const cloudResponse = await cloudinary.uploader.upload(fileUrl);
    const post = await Post.create({
      caption,
      image: cloudResponse.secure_url,
      author: authorId,
    });
    const user = await User.findById(authorId);
    if (user) {
      user.posts.push(post._id);
      await user.save();
    }
    await post.populate({ path: "author", select: "-password" });

    return res.status(201).json({
      message: "New post added",
      post,
      succes: true,
    });
  } catch (error) {
    console.log(error);
  }
};
export const getAllPost = async (req, res) => {
  try {
    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .populate({ path: "author", select: "username, profilePicture" })
      .populate({
        path: "comments",
        sort: { createdAt: -1 },
        populate: {
          path: "author",
          select: "username, profilePicture",
        },
      });
    return res.status(200).json({
      posts,
      success: true,
    });
  } catch (error) {
    console.log(error);
  }
};

export const getUserPost = async (req, res) => {
  try {
    const authorId = req.id;
    const posts = await Post.find({ author: authorId })
      .sort({ createdAt: -1 })
      .populate({
        path: "author",
        select: "username, profilePicture",
      })
      .populate({
        path: "comments",
        sort: { createdAt: -1 },
        populate: {
          path: "author",
          select: "username, profilePicture",
        },
      });
    return res.status(200).json({
      posts,
      success: true,
    });
  } catch (error) {
    console.log(error);
  }
};

export const likePost = async (req, res) => {
  try {
    const usersId = req.id;
    const postId = req.params.id;
    const post = await Post.findById(postId);
    if (!post)
      return res.status(404).json({
        message: "Post not found",
        success: false,
      });

    //like logic started
    await post.updateOne({ $addToSet: { likes: usersId } });
    await post.save();

    // implement socket.io for real time notification

    return res.status(200).json({
      message: "Post liked",
      success: true,
    });
  } catch (error) {
    console.log(error);
  }
};

export const dislikePost = async (req, res) => {
  try {
    const usersId = req.id;
    const postId = req.params.id;
    const post = await Post.findById(postId);
    if (!post)
      return res.status(404).json({
        message: "Post not found",
        success: false,
      });

    //like logic started
    await post.updateOne({ $pull: { likes: usersId } }); // delete
    await post.save();

    // implement socket.io for real time notification
    return res.status(200).json({
      message: "Post disliked",
      success: true,
    });
  } catch (error) {
    console.log(error);
  }
};
export const addComment = async (req, res) => {
  try {
    const postId = req.params.id;
    const usersId = req.id;
    const { text } = req.body;
    const post = await Post.findById(postId);
    if (!text) {
      return res.status(400).json({
        message: " text is requires",
        success: false,
      });
    }
    const comment = await Comment.create({
      text,
      author: usersId,
      post: postId
    }).populate({
      path:"author",
      select:"username, profilePicture"
    });
    
    post.comments.push(comment._id);
    await post.save();
    
    return res.status(201).json({
      message:"Comment added",
      comment,
      succes:true
    })

  } catch (error) {
    console.log(error);
  }
};
export const getCommentsOfPost = async (req,res)=>{
  try {
    const postId = req.params.id;
    const comments = await Comment.find({post:postId}).populate("author","username, profilePicture");

    if(!comments)
      return res.status(404).json({
        messaage:"No comments found for this post",
        success:false
      });
    
    return res.status(200).json({success:true,comments});
  } catch (error) {
    console.log(error);
  }
}
export const deletePost = async (req,res) =>{
  try {
    const postId = req.params.id;
    const authorId = req.id;
    const post = await Post.findById(postId);
    if(!post) return res.status(404).json({ 
      message:"post not found", 
      success :false
    });

    // check if the logged-in user if the owner of this post 
    if(post.author.toString()!= authorId) return res.status(403).json({message:"Unauthorized"});

    // delete post 
    await Post.findByIdAndDelete(postId);

    //remove the post id from the user's post
    let user = await User.findById(authorId);
    user.posts = user.posts.filter(id => id.toString()!= postId);
    await user.save();

    //delete associated comments
    await Comment.deleteMany({post:postId});
    return res.status(200).json({
      success:true,
      message:"Post deleted"
    })
  } catch (error) {
    console.log(error);
  }
}
export const bookmarkPost = async(req,res)=>{
  try {
    const postId = req.params.id;
    const authorId = req.id;
    const post = await Post.findById(postId);
    if(!post) return res.status(404).json({ message:"Post no found", success:false});

    const user = await User.findById(authorId);
    if(user.bookmarks.includes(post._id)){
      // already bookmarked -> remove from the bookmark
      await user.updateOne({$pull:{bookmarks:post._id}});
      await user.save();
      return res.status(200).json({type:"unsaved", message:"post removed from bookmark", success:true});
    }
    else{
      // bookmark it
      await user.updateOne({$addToSet:{bookmarks:post._id}});
      await user.save();
      return res.status(200).json({type:"saved", message:"post bookmarked", success:true});
    }
  } catch (error) {
    console.log(error);
  }
}
