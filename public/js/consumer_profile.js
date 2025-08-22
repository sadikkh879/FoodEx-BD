

//Fetch profile data
document.addEventListener('DOMContentLoaded', async () => {
  const consumerId = localStorage.getItem('consumerId');
  const token = localStorage.getItem('token');

  try {
    const res = await fetch(`/api/consumer/profile/${consumerId}`, {
      headers: {
        Authorization: 'Bearer ' + token
      }
    });

    const data = await res.json();
    // document.getElementById('phone').value = data.number || '';
    // document.getElementById('nid').value = data.nid_number || '';

    // Summary panel
    document.getElementById('summaryName').textContent = data.name || 'N/A';
    document.getElementById('summaryAddress').textContent = data.address || 'N/A';
    document.getElementById('summaryPhone').textContent = data.number || 'N/A';
    document.getElementById('summaryNID').textContent = data.nid_number || 'N/A';

    if (data.profile_photo) {
      document.getElementById('summaryPhoto').innerHTML = `
        <img src="${data.profile_photo}" alt="Profile Photo" />
      `;
    }
  } catch (err) {
    console.error(err);
    alert('Failed to load profile data.');
  }
});

// Toast utility
function showToast(message) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.style.display = 'block';
  setTimeout(() => {
    toast.style.display = 'none';
  }, 4000);
}

// Profile form submission
document.addEventListener('DOMContentLoaded', () => {
  const video = document.getElementById('cameraPreview');
  const canvas = document.getElementById('photoCanvas');
  const captureBtn = document.getElementById('captureBtn');
  const photoDataInput = document.getElementById('photoData');
  const toast = document.getElementById('toast');
  const consumerId = localStorage.getItem('consumerId');

  // Show toast messages
  function showToast(message) {
    toast.textContent = message;
    toast.style.display = 'block';
    setTimeout(() => {
      toast.style.display = 'none';
    }, 3000);
  }

  // Start camera stream
  navigator.mediaDevices.getUserMedia({ video: true })
    .then(stream => {
      video.srcObject = stream;
    })
    .catch(err => {
      console.error("Camera access denied:", err);
      showToast("❌ Unable to access camera.");
    });

  // Capture photo from video stream
  captureBtn.addEventListener('click', () => {
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    const imageData = canvas.toDataURL('image/jpeg');
    photoDataInput.value = imageData;
    showToast("📸 Photo captured. Ready to submit.");
  });

  // Handle profile form submission
  document.getElementById('profileForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const consumerId = localStorage.getItem('consumerId');
    const token = localStorage.getItem('token');
    const imageData = photoDataInput.value;

    if (!imageData) {
      showToast("⚠️ Please capture a photo before submitting.");
      return;
    }

    try {
      const blob = await (await fetch(imageData)).blob();

      const formData = new FormData();
      formData.append('phone', document.getElementById('phone').value);
      formData.append('nid_number', document.getElementById('nid').value);
      formData.append('photo', blob, 'profile.jpg');

      const res = await fetch(`/api/consumer/profileUpdate/${consumerId}`, {
        method: 'PUT',
        headers: {
          Authorization: 'Bearer ' + token
        },
        body: formData
      });

      const result = await res.json();

      if (result.message) {
        showToast(result.message);
      } else {
        showToast("✅ Profile updated successfully.");
      }

    } catch (err) {
      console.error(err);
      showToast("❌ Profile update failed.");
    }
  });
});


document.getElementById('logoutButton').addEventListener("click", function () {
  const confirmLogout = confirm("Are you sure you want to logout?");
  if (confirmLogout) {
    localStorage.clear();
    window.location.href = "landing.html";
  }
});