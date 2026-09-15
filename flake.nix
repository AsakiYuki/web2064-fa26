{
    description = "Bài tập lớn";

    inputs = {
        nixpkgs.url = "github:NixOS/nixpkgs/nixos-26.05";
    };

    outputs = {...}@inputs: let
      system = "x86_64-linux";
      pkgs = import inputs.nixpkgs { inherit system; };
    in {
        devShells.x86_64-linux.default = pkgs.mkShell {
            buildInputs = with pkgs; [ bun ];
            shellHook = ''
                echo "Welcome to the online movie ticketing app devshell!"
            '';
        };
    };
}
