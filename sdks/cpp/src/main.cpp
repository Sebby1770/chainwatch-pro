#include "chainwatch_client.hpp"
#include <iostream>
#include <string>
#include <vector>

int main(int argc, char** argv) {
    using namespace chainwatch;

    std::string cmd = (argc > 1) ? argv[1] : "help";
    std::string key = "";
    std::string chain = "base";
    std::string addr = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";

    for (int i = 2; i < argc; ++i) {
        std::string a = argv[i];
        if (a == "--api-key" && i + 1 < argc) key = argv[++i];
        else if (a == "--chain" && i + 1 < argc) chain = argv[++i];
        else if (!a.empty() && a[0] != '-') addr = a;
    }

    ChainWatchClient client(key);

    if (cmd == "scan" || cmd == "s") {
        auto r = client.scan_wallet(addr, chain, "balanced");
        std::cout << "ChainWatch Pro • " << r.chain << "\n";
        std::cout << "Wallet: " << r.wallet << "\n";
        std::cout << "Risk: " << r.risk_score << "/100   Health: " << r.health_score << "/100\n";
        std::cout << "Value: $" << (long long)r.portfolio_value_usd << "   Positions: " << r.active_positions << "\n";
        std::cout << "Gas: " << r.gas_median << "\n";
        return 0;
    }
    if (cmd == "vaults" || cmd == "v") {
        auto vs = client.list_vaults(6);
        std::cout << "Vault Intelligence (demo)\n";
        for (auto& v : vs) {
            std::cout << " • " << v.name << " (" << v.chain << ")  APY " << v.apy << "%  risk=" << v.risk << "\n";
        }
        return 0;
    }

    std::cout << "ChainWatch Pro C++ CLI\n";
    std::cout << "  chainwatch_cli scan <address> [--chain base] [--api-key ...]\n";
    std::cout << "  chainwatch_cli vaults\n";
    return 0;
}
