export class Preview {
  constructor(containerId, imgId) {
    this.container = document.getElementById(containerId);
    this.img = document.getElementById(imgId);

    this.imgURL = null;
  }

  initialize() {
    this.container.addEventListener("click", this.close.bind(this));
  }

  open(blob) {
    this.imgURL = URL.createObjectURL(blob);
    this.img.src = this.imgURL;
    this.container.style.display = "flex";
  }

  close() {
    this.container.style.display = "none";
    if (this.imgURL) {
      URL.revokeObjectURL(this.imgURL);
    }
  }
}
