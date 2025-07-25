/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
import type {
  BaseContract,
  BigNumberish,
  BytesLike,
  FunctionFragment,
  Result,
  Interface,
  EventFragment,
  AddressLike,
  ContractRunner,
  ContractMethod,
  Listener,
} from "ethers";
import type {
  TypedContractEvent,
  TypedDeferredTopicFilter,
  TypedEventLog,
  TypedLogDescription,
  TypedListener,
  TypedContractMethod,
} from "../common";

export interface UBIManagerInterface extends Interface {
  getFunction(
    nameOrSignature:
      | "authorizedMinters"
      | "batchClaimUBI"
      | "claimUBI"
      | "conditionalToken"
      | "createUBIProgram"
      | "getProgramInfo"
      | "getRemainingBudget"
      | "hasClaimedUBI"
      | "owner"
      | "renounceOwnership"
      | "setMinterAuthorization"
      | "toggleProgramActive"
      | "transferOwnership"
      | "ubiPrograms"
  ): FunctionFragment;

  getEvent(
    nameOrSignatureOrTopic:
      | "MinterAuthorized"
      | "OwnershipTransferred"
      | "UBIClaimed"
      | "UBIProgramCreated"
      | "UBIProgramUpdated"
  ): EventFragment;

  encodeFunctionData(
    functionFragment: "authorizedMinters",
    values: [AddressLike]
  ): string;
  encodeFunctionData(
    functionFragment: "batchClaimUBI",
    values: [BytesLike, AddressLike[]]
  ): string;
  encodeFunctionData(
    functionFragment: "claimUBI",
    values: [BytesLike, AddressLike]
  ): string;
  encodeFunctionData(
    functionFragment: "conditionalToken",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "createUBIProgram",
    values: [BytesLike, BytesLike, BigNumberish, BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "getProgramInfo",
    values: [BytesLike]
  ): string;
  encodeFunctionData(
    functionFragment: "getRemainingBudget",
    values: [BytesLike]
  ): string;
  encodeFunctionData(
    functionFragment: "hasClaimedUBI",
    values: [BytesLike, AddressLike]
  ): string;
  encodeFunctionData(functionFragment: "owner", values?: undefined): string;
  encodeFunctionData(
    functionFragment: "renounceOwnership",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "setMinterAuthorization",
    values: [AddressLike, boolean]
  ): string;
  encodeFunctionData(
    functionFragment: "toggleProgramActive",
    values: [BytesLike]
  ): string;
  encodeFunctionData(
    functionFragment: "transferOwnership",
    values: [AddressLike]
  ): string;
  encodeFunctionData(
    functionFragment: "ubiPrograms",
    values: [BytesLike]
  ): string;

  decodeFunctionResult(
    functionFragment: "authorizedMinters",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "batchClaimUBI",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "claimUBI", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "conditionalToken",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "createUBIProgram",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "getProgramInfo",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "getRemainingBudget",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "hasClaimedUBI",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "owner", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "renounceOwnership",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "setMinterAuthorization",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "toggleProgramActive",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "transferOwnership",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "ubiPrograms",
    data: BytesLike
  ): Result;
}

export namespace MinterAuthorizedEvent {
  export type InputTuple = [minter: AddressLike, authorized: boolean];
  export type OutputTuple = [minter: string, authorized: boolean];
  export interface OutputObject {
    minter: string;
    authorized: boolean;
  }
  export type Event = TypedContractEvent<InputTuple, OutputTuple, OutputObject>;
  export type Filter = TypedDeferredTopicFilter<Event>;
  export type Log = TypedEventLog<Event>;
  export type LogDescription = TypedLogDescription<Event>;
}

export namespace OwnershipTransferredEvent {
  export type InputTuple = [previousOwner: AddressLike, newOwner: AddressLike];
  export type OutputTuple = [previousOwner: string, newOwner: string];
  export interface OutputObject {
    previousOwner: string;
    newOwner: string;
  }
  export type Event = TypedContractEvent<InputTuple, OutputTuple, OutputObject>;
  export type Filter = TypedDeferredTopicFilter<Event>;
  export type Log = TypedEventLog<Event>;
  export type LogDescription = TypedLogDescription<Event>;
}

export namespace UBIClaimedEvent {
  export type InputTuple = [
    programId: BytesLike,
    recipient: AddressLike,
    amount: BigNumberish
  ];
  export type OutputTuple = [
    programId: string,
    recipient: string,
    amount: bigint
  ];
  export interface OutputObject {
    programId: string;
    recipient: string;
    amount: bigint;
  }
  export type Event = TypedContractEvent<InputTuple, OutputTuple, OutputObject>;
  export type Filter = TypedDeferredTopicFilter<Event>;
  export type Log = TypedEventLog<Event>;
  export type LogDescription = TypedLogDescription<Event>;
}

export namespace UBIProgramCreatedEvent {
  export type InputTuple = [
    programId: BytesLike,
    verseId: BytesLike,
    amountPerRecipient: BigNumberish,
    totalBudget: BigNumberish
  ];
  export type OutputTuple = [
    programId: string,
    verseId: string,
    amountPerRecipient: bigint,
    totalBudget: bigint
  ];
  export interface OutputObject {
    programId: string;
    verseId: string;
    amountPerRecipient: bigint;
    totalBudget: bigint;
  }
  export type Event = TypedContractEvent<InputTuple, OutputTuple, OutputObject>;
  export type Filter = TypedDeferredTopicFilter<Event>;
  export type Log = TypedEventLog<Event>;
  export type LogDescription = TypedLogDescription<Event>;
}

export namespace UBIProgramUpdatedEvent {
  export type InputTuple = [programId: BytesLike, active: boolean];
  export type OutputTuple = [programId: string, active: boolean];
  export interface OutputObject {
    programId: string;
    active: boolean;
  }
  export type Event = TypedContractEvent<InputTuple, OutputTuple, OutputObject>;
  export type Filter = TypedDeferredTopicFilter<Event>;
  export type Log = TypedEventLog<Event>;
  export type LogDescription = TypedLogDescription<Event>;
}

export interface UBIManager extends BaseContract {
  connect(runner?: ContractRunner | null): UBIManager;
  waitForDeployment(): Promise<this>;

  interface: UBIManagerInterface;

  queryFilter<TCEvent extends TypedContractEvent>(
    event: TCEvent,
    fromBlockOrBlockhash?: string | number | undefined,
    toBlock?: string | number | undefined
  ): Promise<Array<TypedEventLog<TCEvent>>>;
  queryFilter<TCEvent extends TypedContractEvent>(
    filter: TypedDeferredTopicFilter<TCEvent>,
    fromBlockOrBlockhash?: string | number | undefined,
    toBlock?: string | number | undefined
  ): Promise<Array<TypedEventLog<TCEvent>>>;

  on<TCEvent extends TypedContractEvent>(
    event: TCEvent,
    listener: TypedListener<TCEvent>
  ): Promise<this>;
  on<TCEvent extends TypedContractEvent>(
    filter: TypedDeferredTopicFilter<TCEvent>,
    listener: TypedListener<TCEvent>
  ): Promise<this>;

  once<TCEvent extends TypedContractEvent>(
    event: TCEvent,
    listener: TypedListener<TCEvent>
  ): Promise<this>;
  once<TCEvent extends TypedContractEvent>(
    filter: TypedDeferredTopicFilter<TCEvent>,
    listener: TypedListener<TCEvent>
  ): Promise<this>;

  listeners<TCEvent extends TypedContractEvent>(
    event: TCEvent
  ): Promise<Array<TypedListener<TCEvent>>>;
  listeners(eventName?: string): Promise<Array<Listener>>;
  removeAllListeners<TCEvent extends TypedContractEvent>(
    event?: TCEvent
  ): Promise<this>;

  authorizedMinters: TypedContractMethod<
    [arg0: AddressLike],
    [boolean],
    "view"
  >;

  batchClaimUBI: TypedContractMethod<
    [programId: BytesLike, recipients: AddressLike[]],
    [void],
    "nonpayable"
  >;

  claimUBI: TypedContractMethod<
    [programId: BytesLike, recipient: AddressLike],
    [void],
    "nonpayable"
  >;

  conditionalToken: TypedContractMethod<[], [string], "view">;

  createUBIProgram: TypedContractMethod<
    [
      programId: BytesLike,
      verseId: BytesLike,
      amountPerRecipient: BigNumberish,
      totalBudget: BigNumberish
    ],
    [void],
    "nonpayable"
  >;

  getProgramInfo: TypedContractMethod<
    [programId: BytesLike],
    [
      [string, bigint, bigint, bigint, boolean] & {
        verseId: string;
        amountPerRecipient: bigint;
        totalBudget: bigint;
        distributedAmount: bigint;
        active: boolean;
      }
    ],
    "view"
  >;

  getRemainingBudget: TypedContractMethod<
    [programId: BytesLike],
    [bigint],
    "view"
  >;

  hasClaimedUBI: TypedContractMethod<
    [programId: BytesLike, recipient: AddressLike],
    [boolean],
    "view"
  >;

  owner: TypedContractMethod<[], [string], "view">;

  renounceOwnership: TypedContractMethod<[], [void], "nonpayable">;

  setMinterAuthorization: TypedContractMethod<
    [minter: AddressLike, authorized: boolean],
    [void],
    "nonpayable"
  >;

  toggleProgramActive: TypedContractMethod<
    [programId: BytesLike],
    [void],
    "nonpayable"
  >;

  transferOwnership: TypedContractMethod<
    [newOwner: AddressLike],
    [void],
    "nonpayable"
  >;

  ubiPrograms: TypedContractMethod<
    [arg0: BytesLike],
    [
      [string, bigint, bigint, bigint, boolean] & {
        verseId: string;
        amountPerRecipient: bigint;
        totalBudget: bigint;
        distributedAmount: bigint;
        active: boolean;
      }
    ],
    "view"
  >;

  getFunction<T extends ContractMethod = ContractMethod>(
    key: string | FunctionFragment
  ): T;

  getFunction(
    nameOrSignature: "authorizedMinters"
  ): TypedContractMethod<[arg0: AddressLike], [boolean], "view">;
  getFunction(
    nameOrSignature: "batchClaimUBI"
  ): TypedContractMethod<
    [programId: BytesLike, recipients: AddressLike[]],
    [void],
    "nonpayable"
  >;
  getFunction(
    nameOrSignature: "claimUBI"
  ): TypedContractMethod<
    [programId: BytesLike, recipient: AddressLike],
    [void],
    "nonpayable"
  >;
  getFunction(
    nameOrSignature: "conditionalToken"
  ): TypedContractMethod<[], [string], "view">;
  getFunction(
    nameOrSignature: "createUBIProgram"
  ): TypedContractMethod<
    [
      programId: BytesLike,
      verseId: BytesLike,
      amountPerRecipient: BigNumberish,
      totalBudget: BigNumberish
    ],
    [void],
    "nonpayable"
  >;
  getFunction(
    nameOrSignature: "getProgramInfo"
  ): TypedContractMethod<
    [programId: BytesLike],
    [
      [string, bigint, bigint, bigint, boolean] & {
        verseId: string;
        amountPerRecipient: bigint;
        totalBudget: bigint;
        distributedAmount: bigint;
        active: boolean;
      }
    ],
    "view"
  >;
  getFunction(
    nameOrSignature: "getRemainingBudget"
  ): TypedContractMethod<[programId: BytesLike], [bigint], "view">;
  getFunction(
    nameOrSignature: "hasClaimedUBI"
  ): TypedContractMethod<
    [programId: BytesLike, recipient: AddressLike],
    [boolean],
    "view"
  >;
  getFunction(
    nameOrSignature: "owner"
  ): TypedContractMethod<[], [string], "view">;
  getFunction(
    nameOrSignature: "renounceOwnership"
  ): TypedContractMethod<[], [void], "nonpayable">;
  getFunction(
    nameOrSignature: "setMinterAuthorization"
  ): TypedContractMethod<
    [minter: AddressLike, authorized: boolean],
    [void],
    "nonpayable"
  >;
  getFunction(
    nameOrSignature: "toggleProgramActive"
  ): TypedContractMethod<[programId: BytesLike], [void], "nonpayable">;
  getFunction(
    nameOrSignature: "transferOwnership"
  ): TypedContractMethod<[newOwner: AddressLike], [void], "nonpayable">;
  getFunction(
    nameOrSignature: "ubiPrograms"
  ): TypedContractMethod<
    [arg0: BytesLike],
    [
      [string, bigint, bigint, bigint, boolean] & {
        verseId: string;
        amountPerRecipient: bigint;
        totalBudget: bigint;
        distributedAmount: bigint;
        active: boolean;
      }
    ],
    "view"
  >;

  getEvent(
    key: "MinterAuthorized"
  ): TypedContractEvent<
    MinterAuthorizedEvent.InputTuple,
    MinterAuthorizedEvent.OutputTuple,
    MinterAuthorizedEvent.OutputObject
  >;
  getEvent(
    key: "OwnershipTransferred"
  ): TypedContractEvent<
    OwnershipTransferredEvent.InputTuple,
    OwnershipTransferredEvent.OutputTuple,
    OwnershipTransferredEvent.OutputObject
  >;
  getEvent(
    key: "UBIClaimed"
  ): TypedContractEvent<
    UBIClaimedEvent.InputTuple,
    UBIClaimedEvent.OutputTuple,
    UBIClaimedEvent.OutputObject
  >;
  getEvent(
    key: "UBIProgramCreated"
  ): TypedContractEvent<
    UBIProgramCreatedEvent.InputTuple,
    UBIProgramCreatedEvent.OutputTuple,
    UBIProgramCreatedEvent.OutputObject
  >;
  getEvent(
    key: "UBIProgramUpdated"
  ): TypedContractEvent<
    UBIProgramUpdatedEvent.InputTuple,
    UBIProgramUpdatedEvent.OutputTuple,
    UBIProgramUpdatedEvent.OutputObject
  >;

  filters: {
    "MinterAuthorized(address,bool)": TypedContractEvent<
      MinterAuthorizedEvent.InputTuple,
      MinterAuthorizedEvent.OutputTuple,
      MinterAuthorizedEvent.OutputObject
    >;
    MinterAuthorized: TypedContractEvent<
      MinterAuthorizedEvent.InputTuple,
      MinterAuthorizedEvent.OutputTuple,
      MinterAuthorizedEvent.OutputObject
    >;

    "OwnershipTransferred(address,address)": TypedContractEvent<
      OwnershipTransferredEvent.InputTuple,
      OwnershipTransferredEvent.OutputTuple,
      OwnershipTransferredEvent.OutputObject
    >;
    OwnershipTransferred: TypedContractEvent<
      OwnershipTransferredEvent.InputTuple,
      OwnershipTransferredEvent.OutputTuple,
      OwnershipTransferredEvent.OutputObject
    >;

    "UBIClaimed(bytes32,address,uint256)": TypedContractEvent<
      UBIClaimedEvent.InputTuple,
      UBIClaimedEvent.OutputTuple,
      UBIClaimedEvent.OutputObject
    >;
    UBIClaimed: TypedContractEvent<
      UBIClaimedEvent.InputTuple,
      UBIClaimedEvent.OutputTuple,
      UBIClaimedEvent.OutputObject
    >;

    "UBIProgramCreated(bytes32,bytes32,uint256,uint256)": TypedContractEvent<
      UBIProgramCreatedEvent.InputTuple,
      UBIProgramCreatedEvent.OutputTuple,
      UBIProgramCreatedEvent.OutputObject
    >;
    UBIProgramCreated: TypedContractEvent<
      UBIProgramCreatedEvent.InputTuple,
      UBIProgramCreatedEvent.OutputTuple,
      UBIProgramCreatedEvent.OutputObject
    >;

    "UBIProgramUpdated(bytes32,bool)": TypedContractEvent<
      UBIProgramUpdatedEvent.InputTuple,
      UBIProgramUpdatedEvent.OutputTuple,
      UBIProgramUpdatedEvent.OutputObject
    >;
    UBIProgramUpdated: TypedContractEvent<
      UBIProgramUpdatedEvent.InputTuple,
      UBIProgramUpdatedEvent.OutputTuple,
      UBIProgramUpdatedEvent.OutputObject
    >;
  };
}
