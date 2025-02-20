{
  description = "face swap environment";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = import nixpkgs {
          inherit system;
          config = {
            # cudaSupport = true;
            allowUnfree = true;
          };
        };
        initFish = pkgs.writeText "init.fish" ''
          function prompt_login
            echo "$(set_color red)nix-dev$(set_color normal)"
          end
        '';
      in
      {
        devShells.default = pkgs.mkShell {
          buildInputs = with pkgs; [
            python3Packages.onnxruntime
            python3Packages.insightface
            
            python3Packages.pillow
            python3Packages.uvicorn
            python3Packages.fastapi
            python3Packages.python-multipart
          ];
          
          shellHook = ''
            exec fish --init-command "source ${initFish}"
          '';
        };
      });
}
