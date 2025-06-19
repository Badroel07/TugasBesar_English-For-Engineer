<div class="container-fluid bg-light position-relative shadow">
    <nav class="navbar navbar-expand-lg bg-light navbar-light py-1 py-lg-0 px-0 px-lg-5">
        <a href="{{ url('/') }}" class="navbar-brand font-weight-bold text-secondary" style="font-size: 40px">
            <i class="flaticon-043-teddy-bear"></i>
            <span class="text-primary">Hello English</span>
        </a>
        <button type="button" class="navbar-toggler" data-toggle="collapse" data-target="#navbarCollapse">
            <span class="navbar-toggler-icon"></span>
        </button>
        <div class="collapse navbar-collapse justify-content-between" id="navbarCollapse">
            <div class="navbar-nav font-weight-bold  py-0">
                <a href="{{ url('/') }}"
                    class="nav-item nav-link {{ ($currentPage ?? '') == 'home' ? 'active' : '' }}">Home</a>
                <a href="{{ url('/genres') }}"
                    class="nav-item nav-link {{ ($currentPage ?? '') == 'genres' ? 'active' : '' }}">Genre</a>
                    <div class="nav-item dropdown mb-3 mb-lg-0">
                        <a href="{{ url('/chapter') }}"
                        class="nav-link dropdown-toggle {{ in_array(($currentPage ?? ''), ['blog', 'blog-detail']) ? 'active' : '' }}"
                        data-toggle="dropdown">Chapter</a>
                        <div class="dropdown-menu rounded-0 px-2">
                            <a href="{{ url('/chapter/1') }}" class="dropdown-item">Chapter 1</a>
                            <a href="{{ url('/chapter/2') }}" class="dropdown-item">Chapter 2</a>
                            <a href="{{ url('/chapter/3') }}" class="dropdown-item">Chapter 3</a>
                            <a href="{{ url('/chapter/4') }}" class="dropdown-item">Chapter 4</a>
                            <a href="{{ url('/chapter/5') }}" class="dropdown-item">Chapter 5</a>
                            <a href="{{ url('/chapter/6') }}" class="dropdown-item">Chapter 6</a>
                            <a href="{{ url('/chapter/7') }}" class="dropdown-item">Chapter 7</a>
                        </div>
                    </div>
                <a href="{{ url('/about') }}"
                    class="nav-item nav-link {{ ($currentPage ?? '') == 'about' ? 'active' : '' }}">About</a>

            </div>
            <a href="#" class="btn btn-primary px-4">Quiz Now</a>
        </div>
    </nav>
</div>
