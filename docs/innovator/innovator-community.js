// =====================================
// ECHO - INNOVATOR COMMUNITY
// =====================================


// 1. USER LOGIN CHECK

const email = sessionStorage.getItem("innovatorEmail");

if (!email) {
    window.location.href = "innovator-login.html";
}

const account = JSON.parse(
    localStorage.getItem("innovatorAccount_" + email) || "{}"
);

const profile = JSON.parse(
    localStorage.getItem("innovatorProfile_" + email) || "{}"
);

const userName =
    sessionStorage.getItem("innovatorName") ||
    profile.name ||
    account.name ||
    "Innovator";

document.getElementById("userName").textContent = userName;

document.getElementById("userAvatar").textContent =
    userName.charAt(0).toUpperCase();


// 2. LOGOUT

document.getElementById("logoutBtn").addEventListener("click", function () {

    if (confirm("Are you sure you want to logout?")) {

        sessionStorage.removeItem("innovatorLoggedIn");
        sessionStorage.removeItem("innovatorEmail");
        sessionStorage.removeItem("innovatorName");

        window.location.href = "index.html";

    }

});


// 3. COMMUNITY STORAGE

// This key is shared by Innovator accounts in the same browser.

const communityKey = "echoCommunityPosts";

let posts = JSON.parse(localStorage.getItem(communityKey) || "[]");


// 4. SAVE POSTS

function savePosts() {

    localStorage.setItem(
        communityKey,
        JSON.stringify(posts)
    );

}


// 5. CREATE A NEW POST

const postForm = document.getElementById("postForm");

postForm.addEventListener("submit", function (event) {

    event.preventDefault();

    const title = document.getElementById("postTitle").value.trim();

    const category = document.getElementById("postCategory").value;

    const content = document.getElementById("postContent").value.trim();

    if (!title || !category || !content) {
        return;
    }

    const newPost = {

        id: Date.now(),

        authorEmail: email,

        authorName: userName,

        title: title,

        category: category,

        content: content,

        likes: [],

        comments: [],

        createdAt: new Date().toISOString()

    };

    posts.unshift(newPost);

    savePosts();

    postForm.reset();

    document.getElementById("postMessage").textContent =
        "Your post has been published successfully!";

    displayPosts();

    updateCommunityStats();

});


// 6. FORMAT POST DATE

function formatDate(date) {

    return new Date(date).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric"
    });

}


// 7. DISPLAY COMMUNITY POSTS

function displayPosts() {

    const feed = document.getElementById("postFeed");

    feed.replaceChildren();

    const search = document.getElementById("postSearch")
        .value.toLowerCase();

    const category = document.getElementById("categoryFilter").value;

    const filteredPosts = posts.filter(function (post) {

        const matchesSearch =
            post.title.toLowerCase().includes(search) ||
            post.content.toLowerCase().includes(search) ||
            post.authorName.toLowerCase().includes(search);

        const matchesCategory =
            category === "All" || post.category === category;

        return matchesSearch && matchesCategory;

    });


    document.getElementById("emptyFeed").classList.toggle(
        "hidden",
        filteredPosts.length !== 0
    );


    filteredPosts.forEach(function (post) {

        const card = document.createElement("article");

        card.className = "post-card";


        // AUTHOR INFORMATION

        const author = document.createElement("div");

        author.className = "post-author";

        const avatar = document.createElement("div");

        avatar.className = "author-avatar";

        avatar.textContent = post.authorName.charAt(0).toUpperCase();


        const authorInfo = document.createElement("div");

        authorInfo.className = "author-info";

        const authorName = document.createElement("strong");

        authorName.textContent = post.authorName;

        const date = document.createElement("small");

        date.textContent = formatDate(post.createdAt);

        authorInfo.append(authorName, date);

        author.append(avatar, authorInfo);


        // CATEGORY

        const categoryTag = document.createElement("span");

        categoryTag.className = "post-category";

        categoryTag.textContent = post.category;


        // TITLE

        const title = document.createElement("h3");

        title.textContent = post.title;


        // CONTENT

        const content = document.createElement("p");

        content.className = "post-content";

        content.textContent = post.content;


        // POST ACTIONS

        const actions = document.createElement("div");

        actions.className = "post-actions";


        // LIKE BUTTON

        const likeButton = document.createElement("button");

        const isLiked = post.likes.includes(email);

        likeButton.className = isLiked
            ? "post-action liked"
            : "post-action";

        likeButton.textContent =
            (isLiked ? "♥ " : "♡ ") + post.likes.length + " Likes";


        likeButton.addEventListener("click", function () {

            toggleLike(post.id);

        });


        // COMMENT BUTTON

        const commentButton = document.createElement("button");

        commentButton.className = "post-action";

        commentButton.textContent =
            "▤ " + post.comments.length + " Comments";


        // COMMENTS SECTION

        const commentsArea = document.createElement("div");

        commentsArea.className = "comments-area";


        commentButton.addEventListener("click", function () {

            commentsArea.classList.toggle("open");

        });


        // DELETE BUTTON FOR OWN POSTS

        actions.append(likeButton, commentButton);

        if (post.authorEmail === email) {

            const deleteButton = document.createElement("button");

            deleteButton.className = "post-action delete-post";

            deleteButton.textContent = "Delete";

            deleteButton.addEventListener("click", function () {

                deletePost(post.id);

            });

            actions.appendChild(deleteButton);

        }


        // COMMENT LIST

        const commentList = document.createElement("div");

        commentList.className = "comment-list";

        post.comments.forEach(function (comment) {

            const commentItem = document.createElement("div");

            commentItem.className = "comment-item";

            const commentAvatar = document.createElement("div");

            commentAvatar.className = "comment-avatar";

            commentAvatar.textContent =
                comment.authorName.charAt(0).toUpperCase();

            const commentText = document.createElement("div");

            commentText.className = "comment-text";

            const commentAuthor = document.createElement("strong");

            commentAuthor.textContent = comment.authorName;

            const commentContent = document.createElement("span");

            commentContent.textContent = comment.text;

            commentText.append(commentAuthor, commentContent);

            commentItem.append(commentAvatar, commentText);

            commentList.appendChild(commentItem);

        });


        // COMMENT FORM

        const commentForm = document.createElement("form");

        commentForm.className = "comment-form";

        const commentInput = document.createElement("input");

        commentInput.type = "text";

        commentInput.placeholder = "Write a comment...";

        commentInput.required = true;

        const commentSubmit = document.createElement("button");

        commentSubmit.type = "submit";

        commentSubmit.textContent = "Reply";


        commentForm.append(commentInput, commentSubmit);


        commentForm.addEventListener("submit", function (event) {

            event.preventDefault();

            const commentText = commentInput.value.trim();

            if (!commentText) return;

            addComment(post.id, commentText);

        });


        commentsArea.append(commentList, commentForm);


        // COMPLETE POST CARD

        card.append(
            author,
            categoryTag,
            title,
            content,
            actions,
            commentsArea
        );

        feed.appendChild(card);

    });

}


// 8. LIKE AND UNLIKE POSTS

function toggleLike(postId) {

    const post = posts.find(function (item) {

        return item.id === postId;

    });

    if (!post) return;

    if (!Array.isArray(post.likes)) {
        post.likes = [];
    }

    const alreadyLiked = post.likes.includes(email);

    if (alreadyLiked) {

        post.likes = post.likes.filter(function (userEmail) {

            return userEmail !== email;

        });

    } else {

        post.likes.push(email);

    }

    savePosts();

    displayPosts();

    updateCommunityStats();

}


// 9. ADD COMMENT

function addComment(postId, commentText) {

    const post = posts.find(function (item) {

        return item.id === postId;

    });

    if (!post) return;

    post.comments.push({

        authorEmail: email,

        authorName: userName,

        text: commentText,

        createdAt: new Date().toISOString()

    });

    savePosts();

    displayPosts();

    updateCommunityStats();

}


// 10. DELETE YOUR POST

function deletePost(postId) {

    const post = posts.find(function (item) {

        return item.id === postId;

    });

    if (!post || post.authorEmail !== email) {

        alert("You can delete only your own posts.");

        return;

    }

    const confirmDelete = confirm(
        "Are you sure you want to delete this post?"
    );

    if (!confirmDelete) return;

    posts = posts.filter(function (item) {

        return item.id !== postId;

    });

    savePosts();

    displayPosts();

    updateCommunityStats();

}


// 11. COMMUNITY STATISTICS

function updateCommunityStats() {

    const myPosts = posts.filter(function (post) {

        return post.authorEmail === email;

    });

    let myLikes = 0;

    posts.forEach(function (post) {

        if (post.likes.includes(email)) {

            myLikes++;

        }

    });

    document.getElementById("postCount").textContent = posts.length;

    document.getElementById("myPostCount").textContent = myPosts.length;

    document.getElementById("myLikesCount").textContent = myLikes;

}


// 12. SEARCH POSTS

document.getElementById("postSearch").addEventListener(
    "input",
    displayPosts
);


// 13. FILTER POSTS

document.getElementById("categoryFilter").addEventListener(
    "change",
    displayPosts
);


// 14. INITIAL PAGE LOAD

displayPosts();

updateCommunityStats();


// ==================================
// INNOVATOR LOGOUT
// ==================================

const logoutBtn = document.getElementById("logoutBtn");

if (logoutBtn) {

    logoutBtn.addEventListener("click", function () {

        const confirmLogout = confirm(
            "Are you sure you want to logout?"
        );

        if (confirmLogout) {

            sessionStorage.removeItem("innovatorLoggedIn");
            sessionStorage.removeItem("innovatorEmail");
            sessionStorage.removeItem("innovatorName");

            window.location.href = "index.html";
        }

    });

}
