

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



document.getElementById('profileForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const consumerId = localStorage.getItem('consumerId');
  const token = localStorage.getItem('token');
  const formData = new FormData();

//   formData.append('name', document.getElementById('name').value);
  formData.append('phone', document.getElementById('phone').value);
  formData.append('nid_number', document.getElementById('nid').value);
  formData.append('photo', document.getElementById('photo').files[0]);

  try {
    const res = await fetch(`/api/consumer/profile/${consumerId}`, {
      method: 'PUT',
      headers: {
        Authorization: 'Bearer ' + token
      },
      body: formData
    });

    const result = await res.json();
      //Face detection
  function showToast(message) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.style.display = 'block';
  setTimeout(() => {
    toast.style.display = 'none';
  }, 4000);
}

// Usage
if (result.message === 'Please upload a clear photo showing your face.') {
  showToast('⚠️ Please upload a clear photo showing your face.');
}else{
 // alert(result.message);
 showToast('Profile Updated successfully');
// window.location.href('consumer_profile.html');
}
   // alert(result.message);
  } catch (err) {
    console.error(err);
    alert('Profile update failed.');
  }
});


//NID check
function isValidNID(nid) {
    return /^[0-9]{10}$/.test(nid) || /^[0-9]{13}$/.test(nid) || /^[0-9]{17}$/.test(nid);
  }

  const nidInput = document.getElementById('nid');
  const nidError = document.getElementById('nidError');

  nidInput.addEventListener('input', () => {
    const nid = nidInput.value.trim();
    if (nid === '') {
      nidError.textContent = '';
    } else if (!isValidNID(nid)) {
      nidError.textContent = 'Invalid NID format. Must be 10, 13, or 17 digits.';
    } else {
      nidError.textContent = '';
    }
  });

  //Prevent form submission if NID is invalid
  document.querySelector('form').addEventListener('submit', function (e) {
    const nid = nidInput.value.trim();
    if (!isValidNID(nid)) {
      e.preventDefault();
      nidError.textContent = 'Please enter a valid NID before submitting.';
    }
  });


//Slidebar handle
const toggleBtn = document.getElementById("toggleBtn");
const sidebar = document.getElementById("sidebar");
const closeSidebar = document.getElementById("closeSidebar");
const overlay = document.getElementById("sidebarOverlay");

toggleBtn.addEventListener("click", () => {
  sidebar.classList.add("active");
  overlay.classList.add("active");
});

closeSidebar.addEventListener("click", () => {
  sidebar.classList.remove("active");
  overlay.classList.remove("active");
});

overlay.addEventListener("click", () => {
  sidebar.classList.remove("active");
  overlay.classList.remove("active");
});


document.getElementById('logoutButton').addEventListener("click", function (){
const confirmLogout = confirm("Are you sure you want to logout?");
    if (confirmLogout) {
      localStorage.clear(); 
      window.location.href = "landing.html";
    }
});