document.addEventListener("DOMContentLoaded", function () {
  //for redirection
  var urlParams = new URLSearchParams(window.location.search);
  var targetSectionId = urlParams.get("scroll-to");
  if (targetSectionId) {
    var targetSection = document.getElementById(targetSectionId);
    if (targetSection) {
      var offsetTop = targetSection.offsetTop;
      window.scrollTo({
        top: offsetTop,
        behavior: "smooth",
      });
    }
  }
});

// Handle clicks on anchor links
document.addEventListener("click", function (event) {
  const clickedElement = event.target;
  // Check if the clicked element is an anchor link with an href attribute
  if (clickedElement.tagName === "A" && clickedElement.getAttribute("href")) {
    const href = clickedElement.getAttribute("href");

    // Check if the href attribute contains an anchor link
    if (href.startsWith("#")) {
      // Prevent default behavior to prevent page reload
      event.preventDefault();

      // Scroll to the target section
      const targetId = href.substring(1);
      const targetElement = document.getElementById(targetId);
      if (targetElement) {
        window.scrollTo({
          top: targetElement.offsetTop,
          behavior: "smooth",
        });
      }
    }
  }
});

// for sidebar
document.addEventListener("DOMContentLoaded", function () {
  const hamburger = document.querySelector(".riptus-web-menubar");
  const sidebar = document.querySelector(".riptus-sidebar");
  const closeButton = document.querySelector(".riptus-sidebar-close-btn");
  const overlay = document.querySelector(".overlay");

  function toggleSidebar() {
    sidebar.classList.toggle("active");
    overlay.style.display = sidebar.classList.contains("active")
        ? "block"
        : "none";
    document.body.style.overflow = sidebar.classList.contains("active")
      ? "hidden"
      : "auto";
  }

  function closeSidebar() {
    sidebar.classList.remove("active");
    overlay.style.display = "none";
    document.body.style.overflow = "auto";
  }

  if (hamburger) {
    hamburger.addEventListener("click", toggleSidebar);
  }

  closeButton.addEventListener("click", closeSidebar);

  const menuItems = document.querySelectorAll(".frame9-frame55 a");
  menuItems.forEach(function (item) {
    item.addEventListener("click", function (event) {
      const target = this.getAttribute("href");
      closeSidebar();
    });
  });

  const officialLink = document.querySelector(".official-link");
  if (officialLink) {
    officialLink.addEventListener("click", function (event) {
      const target = this.getAttribute("href");
      closeSidebar();
    });
  }
});

document.addEventListener("DOMContentLoaded", function () {
  // Check if the URL contains the success query parameter
  var urlParams = new URLSearchParams(window.location.search);
  if (urlParams.has("contact_form_success")) {
    // Display the popup message
    var popupMessage = "Your message has been successfully submitted!";
    var popupDuration = 3000; // Duration in milliseconds

    showPopupMessage(popupMessage, popupDuration);
  }
});

function showPopupMessage(message, duration) {
  var popupMessage = document.getElementById("popup-message");
  var popupMessageText = document.getElementById("popup-message-text");

  popupMessageText.textContent = message;
  popupMessage.style.display = "block";

  setTimeout(function () {
    popupMessage.style.display = "none";
  }, duration);
}

// for welcome
function handleTopClick(target) {
  document.querySelector(target).scrollIntoView({ behavior: "smooth" });

  setTimeout(function () {
    document.querySelectorAll(".riptus-web-text102, .riptus-web-text-colored").forEach(function (element) {
      element.style.animation = 'none'; 
      element.offsetHeight; 
      element.style.animation = ''; 
    });

    document.querySelectorAll(".riptus-web-text101").forEach(function (element) {
      element.style.animation = 'none'; 
      element.offsetHeight; 
      element.style.animation = '';
    });

    document.querySelectorAll(".riptus-web-image, .s-pv2-image").forEach(function (element) {
      element.style.animation = 'none'; 
      element.offsetHeight;
      element.style.animation = ''; 
    });
  }, 0);
}

// for about
function handleAboutClick(target) {
  document.querySelector(target).scrollIntoView({ behavior: "smooth" });

  setTimeout(function () {
    document.querySelectorAll(".riptus-web-text074, .riptus-web-rectangle6").forEach(function (element) {
      element.style.animation = 'none'; 
      element.offsetHeight; 
      element.style.animation = ''; 
    });

    document.querySelectorAll(".riptus-web-sv-gbefore1").forEach(function (element) {
      element.style.animation = 'none'; 
      element.offsetHeight; 
      element.style.animation = ''; 
    });

    document.querySelectorAll(".riptus-web-text068, .riptus-web-text070, .riptus-web-text076").forEach(function (element) {
      element.style.animation = 'none'; 
      element.offsetHeight; 
      element.style.animation = '';
    });
  }, 0);
}


//for team
function handleTeamClick(target) {
  document.querySelector(target).scrollIntoView({ behavior: "smooth" });

  setTimeout(function () {
    document.querySelectorAll(".riptus-web-text060").forEach(function (element) {
      element.style.animation = 'none';
      element.offsetHeight;
      element.style.animation = ''; 
    });

    document.querySelectorAll(".riptus-web-sv-gbefore").forEach(function (element) {
      element.style.animation = 'none';
      element.offsetHeight;
      element.style.animation = '';
    });

    document.querySelectorAll(".riptus-web-text062, .riptus-web-text063, .riptus-web-text064, .riptus-web-ellipse1").forEach(function (element) {
      element.style.animation = 'none';
      element.offsetHeight; 
      element.style.animation = '';
    });
  }, 0);
}


// for blog

function handleBlogClick(target) {
  document.querySelector(target).scrollIntoView({ behavior: "smooth" });

  setTimeout(function () {
    document.querySelectorAll(".riptus-web-text032, .more-blogs").forEach(function (element) {
      element.style.animation = 'none'; 
      element.offsetHeight; 
      element.style.animation = ''; 
    });

    document.querySelectorAll(".riptus-web-imag-ebefore2").forEach(function (element) {
      element.style.animation = 'none'; 
      element.offsetHeight; 
      element.style.animation = ''; 
    });

    document.querySelectorAll(".riptus-web-blog1, .riptus-web-blog2").forEach(function (element) {
      element.style.transition = 'none';
      element.offsetHeight;
      element.style.transition = ''; 
      element.style.opacity = '0'; 
      element.style.transform = 'translateY(100%)';
    });

    document.querySelectorAll(".riptus-web-blog1.active, .riptus-web-blog2.active").forEach(function (element) {
      element.style.animation = 'none'; 
      element.offsetHeight;
      element.style.animation = '';
    });
  }, 0);
}
function triggerAnimation() {
  const posts = document.querySelectorAll(".riptus-web-blog1,.riptus-web-blog2");
  const delay = 500;
  let totalDelay = 200;
  posts.forEach((post, index) => {
    if (!post.classList.contains("active")) {
      setTimeout(() => {
        post.classList.add("active");
      }, totalDelay);
      totalDelay += delay;
    }
  });
}
window.addEventListener("load", triggerAnimation);

// for services
function handleServiceClick(target) {
  document.querySelector(target).scrollIntoView({ behavior: "smooth" });

  setTimeout(function () {
    document.querySelectorAll(".riptus-web-text018").forEach(function (element) {
      element.style.animation = 'none';
      element.offsetHeight;
      element.style.animation = ''; 
    });

    document.querySelectorAll(".riptus-web-imag-ebefore1").forEach(function (element) {
      element.style.animation = 'none';
      element.offsetHeight;
      element.style.animation = '';
    });

    document.querySelectorAll(".riptus-web-text020, .riptus-web-text022, .riptus-web-group12, .riptus-web-divimg").forEach(function (element) {
      element.style.animation = 'none';
      element.offsetHeight; 
      element.style.animation = '';
    });
  }, 0);
}

// contact
function handleContactClick(target) {
  document.querySelector(target).scrollIntoView({ behavior: "smooth" });

  setTimeout(function () {
    document.querySelectorAll(".riptus-web-text").forEach(function (element) {
      element.style.animation = 'none';
      element.offsetHeight;
      element.style.animation = ''; 
    });

    document.querySelectorAll(".riptus-web-imag-ebefore").forEach(function (element) {
      element.style.animation = 'none';
      element.offsetHeight;
      element.style.animation = '';
    });

    document.querySelectorAll(".riptus-web-text002").forEach(function (element) {
      element.style.animation = 'none';
      element.offsetHeight; 
      element.style.animation = '';
    });
  }, 0);
}

