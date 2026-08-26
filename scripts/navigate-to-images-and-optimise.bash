#!/usr/bin/env bash

# Run using `./scripts/navigate-to-images-and-optimise.bash "OneDrive 3 May 2026"`
# Pass extra flags through to publish-match-photos.js, e.g. --match-id=<uuid>:
#   ./scripts/navigate-to-images-and-optimise.bash "OneDrive 3 May 2026" --match-id=abc123

# Image Optimization Script
# Navigates to a user-specified folder, creates an 'optimised' folder, and optimizes all images.
# Once optimisation finishes, offers to hand off straight to publish-match-photos.js, which
# resolves the match, uploads the photos to spurs-women-photo-gallery, and links them to the
# match in Supabase - see reference/photo-gallery/README.md.
# Based on the photo gallery system documentation

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print colored output
print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Load environment variables from .env.local if it exists
load_env_local() {
    local env_file="$(dirname "$0")/../.env.local"
    if [[ -f "$env_file" ]]; then
        print_info "Loading environment variables from .env.local..."
        # Simple approach: just source the file
        set -a
        source "$env_file"
        set +a
        print_info "Environment loaded. SPURS_IMAGES_BASE_PATH = ${SPURS_IMAGES_BASE_PATH:-'not set'}"
    else
        print_warning "No .env.local file found at $env_file"
    fi
}

# Check if ImageMagick is installed
check_imagemagick() {
    if ! command -v magick &> /dev/null; then
        print_error "ImageMagick is not installed!"
        echo "Please install ImageMagick:"
        echo "  macOS: brew install imagemagick"
        echo "  Ubuntu: sudo apt-get install imagemagick"
        exit 1
    fi
    print_success "ImageMagick found: $(magick -version | head -n1)"
}

# Validate input directory
validate_directory() {
    local folder_name="$1"
    
    print_info "Validating folder: '$folder_name'" >&2
    
    if [[ -z "$folder_name" ]]; then
        print_error "No folder name specified!"
        echo "Usage: $0 <folder-name>"
        echo "Example: $0 \"20260208 WSL Spurs vs Chelsea\""
        exit 1
    fi
    
    # Get base path from environment variable or prompt user
    local base_path
    if [[ -n "$SPURS_IMAGES_BASE_PATH" ]]; then
        base_path="$SPURS_IMAGES_BASE_PATH"
        print_info "Using base path from environment: $base_path" >&2
    else
        print_info "No environment variable found, prompting for base path..." >&2
        printf "\033[0;34mPlease enter the full path to your Spurs Women images directory:\033[0m\n" >&2
        printf "\033[1;33mThis is the folder that contains your 'OneDrive 3 May 2026' folder\033[0m\n" >&2
        printf "\033[0m" >&2
        read -p "Enter the base path here: " base_path
        printf "\033[0m\n" >&2
        
        if [[ -z "$base_path" ]]; then
            print_error "No base path provided!"
            exit 1
        fi
        
        if [[ ! -d "$base_path" ]]; then
            print_error "Base path '$base_path' does not exist!"
            exit 1
        fi
    fi
    
    print_info "Checking target directory: $base_path/$folder_name" >&2
    local target_dir="$base_path/$folder_name"
    
    if [[ ! -d "$target_dir" ]]; then
        print_error "Directory '$target_dir' does not exist!"
        echo "Available folders in $base_path:"
        if [[ -d "$base_path" ]]; then
            ls -la "$base_path" | grep "^d" | awk '{print "  " $NF}' | grep -v "^\.$" | grep -v "^\.\.$"
        fi
        exit 1
    fi
    
    # Convert to absolute path
    print_info "Converting to absolute path..." >&2
    local abs_dir
    abs_dir="$(cd "$target_dir" && pwd)"
    print_info "Absolute path: $abs_dir" >&2
    
    # Only output the absolute path (no debug messages)
    echo "$abs_dir"
}

# Count images in directory
count_images() {
    local dir="$1"
    find "$dir" -type f \( -iname "*.jpg" -o -iname "*.jpeg" -o -iname "*.png" -o -iname "*.tiff" -o -iname "*.bmp" \) | wc -l
}

# Optimize images using ImageMagick
optimize_images() {
    local source_dir="$1"
    local optimised_dir="$2"
    
    print_info "Starting image optimization..."
    
    # Create optimised directory if it doesn't exist
    mkdir -p "$optimised_dir"
    
    # Find all image files (compatible with older bash versions)
    local image_files=()
    while IFS= read -r -d $'\0' file; do
        image_files+=("$file")
    done < <(find "$source_dir" -type f \( -iname "*.jpg" -o -iname "*.jpeg" -o -iname "*.png" -o -iname "*.tiff" -o -iname "*.bmp" \) -print0)
    
    if [[ ${#image_files[@]} -eq 0 ]]; then
        print_warning "No image files found in '$source_dir'"
        return 1
    fi
    
    print_info "Found ${#image_files[@]} image(s) to optimize"
    
    # Optimize each image
    local processed=0
    local failed=0
    
    for image_file in "${image_files[@]}"; do
        local filename
        filename="$(basename "$image_file")"
        local filename_noext="${filename%.*}"
        local output_file="$optimised_dir/${filename_noext}.webp"
        
        print_info "Processing: $filename"
        
        if magick "$image_file" \
            -resize 2000x2000\> \
            -strip \
            -quality 82 \
            "$output_file" 2>/dev/null; then
            
            # Get file sizes for comparison
            local original_size
            local optimized_size
            original_size=$(stat -f%z "$image_file" 2>/dev/null || stat -c%s "$image_file" 2>/dev/null || echo "0")
            optimized_size=$(stat -f%z "$output_file" 2>/dev/null || stat -c%s "$output_file" 2>/dev/null || echo "0")
            
            if [[ "$original_size" -gt 0 && "$optimized_size" -gt 0 ]]; then
                local savings
                savings=$(( (original_size - optimized_size) * 100 / original_size ))
                print_success "✓ $filename → ${filename_noext}.webp (${savings}% smaller)"
            else
                print_success "✓ $filename → ${filename_noext}.webp"
            fi
            
            ((processed++))
        else
            print_error "✗ Failed to process $filename"
            ((failed++))
        fi
    done
    
    echo
    print_success "Optimization complete!"
    print_info "Processed: $processed images"
    if [[ $failed -gt 0 ]]; then
        print_warning "Failed: $failed images"
    fi
    
    # Show total size of optimized folder
    if command -v du &> /dev/null; then
        local total_size
        total_size=$(du -sh "$optimised_dir" | cut -f1)
        print_info "Total optimized size: $total_size"
    fi
    
    return 0
}

# Main function
main() {
    echo "🖼️  Image Optimization Script"
    echo "============================="
    echo
    
    # Load environment variables from .env.local
    load_env_local
    
    # Check dependencies
    check_imagemagick
    echo
    
    print_info "Starting directory validation..."
    
    # Get and validate directory. Remaining args (e.g. --match-id=<uuid>) are
    # forwarded to publish-match-photos.js at the end.
    local folder_name="$1"
    shift || true
    local validated_dir
    validated_dir=$(validate_directory "$folder_name")
    
    print_info "Target directory: $validated_dir"
    
    # Count images before optimization
    local image_count
    image_count=$(count_images "$validated_dir")
    
    if [[ $image_count -eq 0 ]]; then
        print_warning "No images found in the directory!"
        exit 1
    fi
    
    print_info "Found $image_count image(s) to process"
    echo
    
    # Set up paths
    local optimised_dir="$validated_dir/optimised"
    
    # Check if optimised folder already exists
    if [[ -d "$optimised_dir" ]]; then
        print_warning "Optimised folder already exists!"
        read -p "Do you want to continue and potentially overwrite files? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            print_info "Operation cancelled."
            exit 0
        fi
    fi
    
    # Optimize images
    if optimize_images "$validated_dir" "$optimised_dir"; then
        echo
        print_success "All images optimized successfully!"
        print_info "Optimized images saved to: $optimised_dir"
        echo

        local publish_script
        publish_script="$(dirname "${BASH_SOURCE[0]}")/publish-match-photos.js"

        if ! command -v node &> /dev/null || [[ ! -f "$publish_script" ]]; then
            print_warning "Can't hand off to publish-match-photos.js (node or the script itself is missing)."
            print_info "Next steps:"
            echo "1. Upload optimized images to your photo repository"
            echo "2. Update the database with correct folder keys"
            echo "3. Run: npm run generate-external-manifest"
            echo "4. Run: npm run validate-manifest"
            return 0
        fi

        print_info "Review the photos in '$optimised_dir' now if you want to remove any before they go live."
        read -p "Publish these photos to the gallery repo and link them to the match now? (Y/n): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Nn]$ ]]; then
            print_info "Skipping publish. Run this when you're ready:"
            echo "  npm run publish-match-photos -- \"$folder_name\""
            return 0
        fi

        node "$publish_script" "$folder_name" "$@"
    else
        print_error "Optimization failed!"
        exit 1
    fi
}

# Run main function with all arguments
main "$@"