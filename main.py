import time
from multiprocessing import Pool


def collatz_length(n, memo):
    """
    Calculate the length of the Collatz sequence for `n` using memoization.
    """
    original = n
    steps = 0

    while n != 1:
        if n in memo:
            steps += memo[n]
            break
        if n & 1:  # Odd number
            n = 3 * n + 1
        else:  # Even number
            n >>= 1  # Equivalent to n //= 2
        steps += 1

    # Memoize the result for the original number
    memo[original] = steps
    return steps


def find_collatz_length(args):
    """
    Helper function to find the Collatz sequence length for a given number.
    """
    n, memo = args
    return collatz_length(n, memo)


def find_longest_collatz(limit):
    """
    Find the number with the longest Collatz sequence under `limit`.
    """
    memo = {1: 1}  # Base case
    max_length = 0
    number_with_max_length = 0

    with Pool() as pool:
        results = pool.map(find_collatz_length, [(i, memo) for i in range(1, limit)])

    for i, length in enumerate(results, start=1):
        if length > max_length:
            max_length = length
            number_with_max_length = i

    return number_with_max_length, max_length


if __name__ == "__main__":
    limit = 10**7  # Testing with 1 billion
    start_time = time.time()
    number, length = find_longest_collatz(limit)
    end_time = time.time()

    print(
        f"The number under {limit} with the longest Collatz sequence is {number}, with a length of {length}."
    )
    print(f"Execution time: {end_time - start_time:.2f} seconds")
