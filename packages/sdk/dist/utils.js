/**
 * Utility functions for SDK
 */
export const formatAddress = (address) => {
    if (!address || address.length < 10)
        return address;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
};
export const isValidAddress = (address) => {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
};
