{
  description = "face swap frontend environment";

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
            nodejs
          ];
          
          shellHook = ''
            exec fish --init-command "source ${initFish}"
          '';
        };
      });
}
