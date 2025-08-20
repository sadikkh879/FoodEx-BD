

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
        <img src="/uploads/profiles/${data.profile_photo}" alt="Profile Photo" />
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
document.getElementById('profileForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const consumerId = localStorage.getItem('consumerId');
  const token = localStorage.getItem('token');
  const photoFile = document.getElementById('photo').files[0];

  if (!photoFile) {
    showToast("⚠️ Please upload a profile photo.");
    return;
  }

  try {
    // Step 1: Validate face using Flask API
    const faceFormData = new FormData();
    faceFormData.append('photo', photoFile);

    const faceRes = await fetch("http://localhost:5001/detect-face", {
      method: "POST",
      body: faceFormData
    });

    const faceData = await faceRes.json();

    if (!faceData.faceDetected) {
      showToast("⚠️ No face detected. Please upload a clear photo of your face.");
      return;
    }

    if (faceData.facesCount > 1) {
      showToast("⚠️ Multiple faces detected. Please upload a photo with only your face.");
      return;
    }

    // Step 2: If valid, proceed with backend update
    const formData = new FormData();
    formData.append('phone', document.getElementById('phone').value);
    formData.append('nid_number', document.getElementById('nid').value);
    formData.append('photo', photoFile);

    const res = await fetch(`/api/consumer/profile/${consumerId}`, {
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


document.getElementById('logoutButton').addEventListener("click", function (){
const confirmLogout = confirm("Are you sure you want to logout?");
    if (confirmLogout) {
      localStorage.clear(); 
      window.location.href = "landing.html";
    }
});